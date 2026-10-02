import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CatalogMapper, productImageInclude } from "./catalog.mapper.js";
import type { ProductImageListDto } from "./dto/catalog-response.dto.js";
import type {
  AttachProductImageDto,
  ReorderProductImagesDto,
  ReplaceProductImageDto,
  UpdateProductImageDto,
} from "./dto/product-input.dto.js";

export const MAX_IMAGES_PER_PRODUCT = 20;
const PRODUCT_MEDIA = [MediaCategory.PRODUCT] as const;

/**
 * Product galleries. Every mutation runs in a transaction that first locks the
 * product row, so concurrent edits queue up and the invariants hold:
 *   - sortOrder is 0..n-1 with no gaps;
 *   - exactly one image is primary whenever the product has images
 *     (also enforced by a partial unique index).
 * Detached assets are released afterwards — deleted from the database and R2
 * only when nothing else (e.g. a duplicated product) still uses them.
 */
@Injectable()
export class ProductImagesService {
  private readonly logger = new Logger(ProductImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CatalogMapper,
  ) {}

  async list(productId: string): Promise<ProductImageListDto> {
    const exists = await this.prisma.product.count({ where: { id: productId } });
    if (!exists) throw notFound("Product");
    return this.snapshot(this.prisma, productId);
  }

  async attach(
    admin: AuthUser,
    productId: string,
    dto: AttachProductImageDto,
  ): Promise<ProductImageListDto> {
    const result = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      await this.media.assertAttachable(dto.mediaAssetId, PRODUCT_MEDIA, tx);

      const images = await tx.productImage.findMany({
        where: { productId },
        select: { id: true, mediaAssetId: true },
      });
      if (images.some((image) => image.mediaAssetId === dto.mediaAssetId)) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.CONFLICT,
          "This image is already in the product's gallery.",
        );
      }
      if (images.length >= MAX_IMAGES_PER_PRODUCT) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.LIMIT_REACHED,
          `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`,
        );
      }

      const makePrimary = images.length === 0 || dto.isPrimary === true;
      if (makePrimary) {
        await tx.productImage.updateMany({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      const created = await tx.productImage.create({
        data: {
          productId,
          mediaAssetId: dto.mediaAssetId,
          sortOrder: images.length,
          isPrimary: makePrimary,
          altText: dto.altText ?? null,
          caption: dto.caption ?? null,
        },
        select: { id: true },
      });
      await this.touchProduct(tx, productId, admin);
      return { imageId: created.id, list: await this.snapshot(tx, productId) };
    });

    this.logger.log(
      {
        adminId: admin.id,
        productId,
        productImageId: result.imageId,
        mediaAssetId: dto.mediaAssetId,
      },
      "Product image attached",
    );
    return result.list;
  }

  async update(
    admin: AuthUser,
    productId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ): Promise<ProductImageListDto> {
    const list = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      await this.findImage(tx, productId, imageId);
      await tx.productImage.update({
        where: { id: imageId },
        data: {
          ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
          ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        },
      });
      await this.touchProduct(tx, productId, admin);
      return this.snapshot(tx, productId);
    });
    this.logger.log(
      { adminId: admin.id, productId, productImageId: imageId },
      "Product image updated",
    );
    return list;
  }

  async remove(admin: AuthUser, productId: string, imageId: string): Promise<ProductImageListDto> {
    const { list, mediaAssetId } = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      const image = await this.findImage(tx, productId, imageId);
      await tx.productImage.delete({ where: { id: imageId } });

      const remaining = await tx.productImage.findMany({
        where: { productId },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      await this.writeOrder(
        tx,
        remaining.map((row) => row.id),
      );
      const first = remaining[0];
      if (image.isPrimary && first) {
        await tx.productImage.update({ where: { id: first.id }, data: { isPrimary: true } });
      }
      await this.touchProduct(tx, productId, admin);
      return { list: await this.snapshot(tx, productId), mediaAssetId: image.mediaAssetId };
    });

    const released = await this.media.releaseIfUnreferenced(mediaAssetId);
    this.logger.log(
      {
        adminId: admin.id,
        productId,
        productImageId: imageId,
        mediaAssetId,
        assetDeleted: released,
      },
      "Product image removed",
    );
    return list;
  }

  async reorder(
    admin: AuthUser,
    productId: string,
    dto: ReorderProductImagesDto,
  ): Promise<ProductImageListDto> {
    const list = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      const current = await tx.productImage.findMany({
        where: { productId },
        select: { id: true },
      });
      const requested = new Set(dto.imageIds);
      const sameSet =
        requested.size === dto.imageIds.length &&
        requested.size === current.length &&
        current.every((image) => requested.has(image.id));
      if (!sameSet) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ErrorCode.VALIDATION_FAILED,
          "The new order must list every image of this product exactly once.",
          [
            {
              field: "imageIds",
              messages: ["imageIds must contain each of the product's image ids once"],
            },
          ],
        );
      }
      await this.writeOrder(tx, dto.imageIds);
      await this.touchProduct(tx, productId, admin);
      return this.snapshot(tx, productId);
    });
    this.logger.log({ adminId: admin.id, productId }, "Product images reordered");
    return list;
  }

  async setPrimary(
    admin: AuthUser,
    productId: string,
    imageId: string,
  ): Promise<ProductImageListDto> {
    const list = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      await this.findImage(tx, productId, imageId);
      // Clear first: the partial unique index allows one primary per product.
      await tx.productImage.updateMany({
        where: { productId, isPrimary: true, id: { not: imageId } },
        data: { isPrimary: false },
      });
      await tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });
      await this.touchProduct(tx, productId, admin);
      return this.snapshot(tx, productId);
    });
    this.logger.log(
      { adminId: admin.id, productId, productImageId: imageId },
      "Primary product image set",
    );
    return list;
  }

  /**
   * Swaps the file behind an image while keeping its place and primary flag:
   * the new asset (already uploaded and verified) is attached, then the old one
   * is released if nothing else uses it.
   */
  async replace(
    admin: AuthUser,
    productId: string,
    imageId: string,
    dto: ReplaceProductImageDto,
  ): Promise<ProductImageListDto> {
    const { list, previousAssetId } = await this.prisma.$transaction(async (tx) => {
      await this.lockProduct(tx, productId);
      const image = await this.findImage(tx, productId, imageId);
      if (image.mediaAssetId !== dto.mediaAssetId) {
        await this.media.assertAttachable(dto.mediaAssetId, PRODUCT_MEDIA, tx);
        const clash = await tx.productImage.count({
          where: { productId, mediaAssetId: dto.mediaAssetId },
        });
        if (clash > 0) {
          throw new ApiException(
            HttpStatus.CONFLICT,
            ErrorCode.CONFLICT,
            "This image is already in the product's gallery.",
          );
        }
      }
      await tx.productImage.update({
        where: { id: imageId },
        data: { mediaAssetId: dto.mediaAssetId, altText: dto.altText ?? null },
      });
      await this.touchProduct(tx, productId, admin);
      return { list: await this.snapshot(tx, productId), previousAssetId: image.mediaAssetId };
    });

    let released = false;
    if (previousAssetId !== dto.mediaAssetId) {
      released = await this.media.releaseIfUnreferenced(previousAssetId);
    }
    this.logger.log(
      {
        adminId: admin.id,
        productId,
        productImageId: imageId,
        mediaAssetId: dto.mediaAssetId,
        previousAssetId,
        previousAssetDeleted: released,
      },
      "Product image replaced",
    );
    return list;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async lockProduct(tx: Prisma.TransactionClient, productId: string): Promise<void> {
    if (!(await lockRow(tx, "products", productId))) throw notFound("Product");
  }

  private async findImage(tx: Prisma.TransactionClient, productId: string, imageId: string) {
    const image = await tx.productImage.findFirst({ where: { id: imageId, productId } });
    if (!image) throw notFound("Product image");
    return image;
  }

  private async writeOrder(tx: Prisma.TransactionClient, orderedIds: string[]): Promise<void> {
    for (const [index, id] of orderedIds.entries()) {
      await tx.productImage.update({ where: { id }, data: { sortOrder: index } });
    }
  }

  /** Gallery edits count as edits of the product (updatedAt, updatedBy). */
  private async touchProduct(tx: Prisma.TransactionClient, productId: string, admin: AuthUser) {
    await tx.product.update({ where: { id: productId }, data: { updatedById: admin.id } });
  }

  private async snapshot(
    client: Prisma.TransactionClient,
    productId: string,
  ): Promise<ProductImageListDto> {
    const images = await client.productImage.findMany({
      where: { productId },
      include: productImageInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return { productId, images: images.map((image) => this.mapper.productImage(image)) };
  }
}
