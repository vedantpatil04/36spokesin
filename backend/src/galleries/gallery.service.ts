import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { CatalogMapper } from "../catalog/catalog.mapper.js";
import type { ProductImageDto } from "../catalog/dto/catalog-response.dto.js";
import type {
  AttachProductImageDto,
  ReorderProductImagesDto,
  ReplaceProductImageDto,
  UpdateProductImageDto,
} from "../catalog/dto/product-input.dto.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaService } from "../media/media.service.js";
import {
  GALLERY_OWNERS,
  type GalleryImageRow,
  type GalleryOwner,
  galleryInclude,
  ownerColumns,
  ownerWhere,
} from "./gallery-owners.js";

export const MAX_GALLERY_IMAGES = 30;

export type GalleryList = { ownerId: string; images: ProductImageDto[] };

/**
 * Photo galleries for destinations, trips and rides, with the same guarantees
 * as product images (Phase 4): each mutation locks the owner row, ordering stays
 * 0..n-1, exactly one image is primary (partial unique index as backstop), and
 * detached assets are deleted from R2 only when nothing else references them.
 */
@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CatalogMapper,
  ) {}

  image(row: GalleryImageRow): ProductImageDto {
    return {
      ...this.mapper.image(row.mediaAsset, row.altText),
      id: row.id,
      mediaAssetId: row.mediaAssetId,
      caption: row.caption,
      sortOrder: row.sortOrder,
      isPrimary: row.isPrimary,
    };
  }

  async list(owner: GalleryOwner, ownerId: string): Promise<GalleryList> {
    return this.prisma.$transaction(async (tx) => {
      await this.lock(tx, owner, ownerId);
      return this.snapshot(tx, owner, ownerId);
    });
  }

  async attach(admin: AuthUser, owner: GalleryOwner, ownerId: string, dto: AttachProductImageDto) {
    return this.mutate(admin, owner, ownerId, "attach", async (tx) => {
      await this.media.assertAttachable(dto.mediaAssetId, [GALLERY_OWNERS[owner].category], tx);
      const images = await tx.galleryImage.findMany({
        where: ownerWhere(owner, ownerId),
        select: { mediaAssetId: true },
      });
      if (images.some((image) => image.mediaAssetId === dto.mediaAssetId)) throw alreadyInGallery();
      if (images.length >= MAX_GALLERY_IMAGES) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.LIMIT_REACHED,
          `A gallery can have at most ${MAX_GALLERY_IMAGES} images.`,
        );
      }
      const primary = images.length === 0 || dto.isPrimary === true;
      if (primary) await this.clearPrimary(tx, owner, ownerId);
      await tx.galleryImage.create({
        data: {
          ...ownerColumns(owner, ownerId),
          mediaAssetId: dto.mediaAssetId,
          sortOrder: images.length,
          isPrimary: primary,
          altText: dto.altText ?? null,
          caption: dto.caption ?? null,
        },
      });
      return null;
    });
  }

  async update(
    admin: AuthUser,
    owner: GalleryOwner,
    ownerId: string,
    imageId: string,
    dto: UpdateProductImageDto,
  ) {
    return this.mutate(admin, owner, ownerId, "update", async (tx) => {
      await this.find(tx, owner, ownerId, imageId);
      await tx.galleryImage.update({
        where: { id: imageId },
        data: {
          ...(dto.altText !== undefined ? { altText: dto.altText } : {}),
          ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        },
      });
      return null;
    });
  }

  async remove(admin: AuthUser, owner: GalleryOwner, ownerId: string, imageId: string) {
    return this.mutate(admin, owner, ownerId, "remove", async (tx) => {
      const image = await this.find(tx, owner, ownerId, imageId);
      await tx.galleryImage.delete({ where: { id: imageId } });
      const remaining = await tx.galleryImage.findMany({
        where: ownerWhere(owner, ownerId),
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });
      await this.writeOrder(
        tx,
        remaining.map((row) => row.id),
      );
      const first = remaining[0];
      if (image.isPrimary && first) {
        await tx.galleryImage.update({ where: { id: first.id }, data: { isPrimary: true } });
      }
      return image.mediaAssetId;
    });
  }

  async reorder(
    admin: AuthUser,
    owner: GalleryOwner,
    ownerId: string,
    dto: ReorderProductImagesDto,
  ) {
    return this.mutate(admin, owner, ownerId, "reorder", async (tx) => {
      const current = await tx.galleryImage.findMany({
        where: ownerWhere(owner, ownerId),
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
          "The new order must list every image in the gallery exactly once.",
          [{ field: "imageIds", messages: ["imageIds must contain each gallery image id once"] }],
        );
      }
      await this.writeOrder(tx, dto.imageIds);
      return null;
    });
  }

  async setPrimary(admin: AuthUser, owner: GalleryOwner, ownerId: string, imageId: string) {
    return this.mutate(admin, owner, ownerId, "primary", async (tx) => {
      await this.find(tx, owner, ownerId, imageId);
      await this.clearPrimary(tx, owner, ownerId, imageId);
      await tx.galleryImage.update({ where: { id: imageId }, data: { isPrimary: true } });
      return null;
    });
  }

  async replace(
    admin: AuthUser,
    owner: GalleryOwner,
    ownerId: string,
    imageId: string,
    dto: ReplaceProductImageDto,
  ) {
    return this.mutate(admin, owner, ownerId, "replace", async (tx) => {
      const image = await this.find(tx, owner, ownerId, imageId);
      if (image.mediaAssetId === dto.mediaAssetId) return null;
      await this.media.assertAttachable(dto.mediaAssetId, [GALLERY_OWNERS[owner].category], tx);
      const clash = await tx.galleryImage.count({
        where: { ...ownerWhere(owner, ownerId), mediaAssetId: dto.mediaAssetId },
      });
      if (clash > 0) throw alreadyInGallery();
      await tx.galleryImage.update({
        where: { id: imageId },
        data: { mediaAssetId: dto.mediaAssetId, altText: dto.altText ?? null },
      });
      return image.mediaAssetId;
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Runs one gallery change under the owner's row lock, then releases the asset
   * the change detached (if any) once the transaction has committed.
   */
  private async mutate(
    admin: AuthUser,
    owner: GalleryOwner,
    ownerId: string,
    action: string,
    work: (tx: Prisma.TransactionClient) => Promise<string | null>,
  ): Promise<GalleryList> {
    const { list, detached } = await this.prisma.$transaction(async (tx) => {
      await this.lock(tx, owner, ownerId);
      const detachedAssetId = await work(tx);
      return { list: await this.snapshot(tx, owner, ownerId), detached: detachedAssetId };
    });
    const released = detached ? await this.media.releaseIfUnreferenced(detached) : false;
    this.logger.log(
      { adminId: admin.id, owner, ownerId, action, ...(detached ? { detached, released } : {}) },
      "Gallery changed",
    );
    return list;
  }

  private async lock(tx: Prisma.TransactionClient, owner: GalleryOwner, ownerId: string) {
    if (!(await lockRow(tx, GALLERY_OWNERS[owner].table, ownerId))) {
      throw notFound(GALLERY_OWNERS[owner].label);
    }
  }

  private async find(
    tx: Prisma.TransactionClient,
    owner: GalleryOwner,
    ownerId: string,
    imageId: string,
  ) {
    const image = await tx.galleryImage.findFirst({
      where: { id: imageId, ...ownerWhere(owner, ownerId) },
    });
    if (!image) throw notFound("Image");
    return image;
  }

  private async clearPrimary(
    tx: Prisma.TransactionClient,
    owner: GalleryOwner,
    ownerId: string,
    exceptId?: string,
  ) {
    await tx.galleryImage.updateMany({
      where: {
        ...ownerWhere(owner, ownerId),
        isPrimary: true,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isPrimary: false },
    });
  }

  private async writeOrder(tx: Prisma.TransactionClient, ids: string[]) {
    for (const [index, id] of ids.entries()) {
      await tx.galleryImage.update({ where: { id }, data: { sortOrder: index } });
    }
  }

  private async snapshot(
    client: Prisma.TransactionClient,
    owner: GalleryOwner,
    ownerId: string,
  ): Promise<GalleryList> {
    const rows = await client.galleryImage.findMany({
      where: ownerWhere(owner, ownerId),
      ...galleryInclude,
    });
    return { ownerId, images: rows.map((row) => this.image(row)) };
  }
}

function alreadyInGallery(): ApiException {
  return new ApiException(
    HttpStatus.CONFLICT,
    ErrorCode.CONFLICT,
    "This image is already in the gallery.",
  );
}
