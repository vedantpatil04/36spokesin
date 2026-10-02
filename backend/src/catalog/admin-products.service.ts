import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { CursorPage } from "../common/http/cursor-page.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { ProductStatus } from "../generated/prisma/enums.js";
import { CatalogMapper, adminProductListInclude, productDetailInclude } from "./catalog.mapper.js";
import type { AdminProductDto, AdminProductListItemDto } from "./dto/catalog-response.dto.js";
import type {
  CreateProductDto,
  ProductCompatibilityInputDto,
  ProductSpecificationInputDto,
  UpdateProductDto,
} from "./dto/product-input.dto.js";
import type { AdminProductListQueryDto, AdminProductSort } from "./dto/product-query.dto.js";
import { invalidReference, resolveSlug, slugTaken } from "./unique-slug.js";

const ADMIN_SORT_ORDER: Record<AdminProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  updated_desc: [{ updatedAt: "desc" }, { id: "desc" }],
  created_desc: [{ createdAt: "desc" }, { id: "desc" }],
  name_asc: [{ name: "asc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "desc" }],
  stock_asc: [{ stockQuantity: "asc" }, { id: "asc" }],
};

/**
 * Admin product management. Scalar fields, specifications and compatibility are
 * written in one transaction, so a product is never half-saved. Images have their
 * own service (ProductImagesService).
 */
@Injectable()
export class AdminProductsService {
  private readonly logger = new Logger(AdminProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CatalogMapper,
  ) {}

  async list(query: AdminProductListQueryDto): Promise<CursorPage<AdminProductListItemDto>> {
    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { sku: { contains: query.q, mode: "insensitive" } },
              { slug: { contains: query.q.toLowerCase() } },
            ],
          }
        : {}),
    };
    const rows = await this.prisma.product.findMany({
      where,
      include: adminProductListInclude,
      orderBy: ADMIN_SORT_ORDER[query.sort ?? "updated_desc"],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return CursorPage.fromRows(rows, query.limit, (row) => this.mapper.adminListItem(row));
  }

  async get(id: string): Promise<AdminProductDto> {
    const row = await this.prisma.product.findUnique({
      where: { id },
      include: productDetailInclude,
    });
    if (!row) throw notFound("Product");
    return this.mapper.adminDetail(row);
  }

  async create(admin: AuthUser, dto: CreateProductDto): Promise<AdminProductDto> {
    await this.assertReferences(dto);
    await this.assertSkuFree(dto.sku);
    this.assertPricing(dto.price, dto.compareAtPrice ?? null);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "product",
      isTaken: (candidate) => this.slugTaken(candidate),
    });
    const compatibility = await this.validateCompatibility(dto.compatibility ?? []);
    const status = dto.status ?? ProductStatus.DRAFT;

    const id = await this.writeTransaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug,
          sku: dto.sku,
          name: dto.name,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          categoryId: dto.categoryId,
          brandId: dto.brandId ?? null,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice ?? null,
          currency: dto.currency ?? "INR",
          status,
          featured: dto.featured ?? false,
          stockQuantity: dto.stockQuantity ?? 0,
          ...(dto.stockStatus ? { stockStatus: dto.stockStatus } : {}),
          weightGrams: dto.weightGrams ?? null,
          universalFit: dto.universalFit ?? false,
          publishedAt: status === ProductStatus.PUBLISHED ? new Date() : null,
          createdById: admin.id,
          updatedById: admin.id,
        },
        select: { id: true },
      });
      await replaceSpecifications(tx, product.id, dto.specifications ?? []);
      await replaceCompatibility(tx, product.id, compatibility);
      return product.id;
    });

    this.logger.log({ adminId: admin.id, productId: id, status }, "Product created");
    return this.get(id);
  }

  async update(admin: AuthUser, id: string, dto: UpdateProductDto): Promise<AdminProductDto> {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        publishedAt: true,
      },
    });
    if (!existing) throw notFound("Product");

    await this.assertReferences(dto);
    if (dto.sku && dto.sku !== existing.sku) await this.assertSkuFree(dto.sku);
    if (dto.slug && dto.slug !== existing.slug && (await this.slugTaken(dto.slug))) {
      throw slugTaken("product");
    }
    const price = dto.price ?? existing.price;
    const compareAtPrice =
      dto.compareAtPrice !== undefined ? dto.compareAtPrice : existing.compareAtPrice;
    this.assertPricing(price, compareAtPrice);
    const compatibility = dto.compatibility
      ? await this.validateCompatibility(dto.compatibility)
      : null;

    const publishing = dto.status === ProductStatus.PUBLISHED && existing.publishedAt === null;
    const data: Prisma.ProductUncheckedUpdateInput = {
      // Non-nullable columns ignore an explicit null rather than failing the write.
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.slug ? { slug: dto.slug } : {}),
      ...(dto.sku ? { sku: dto.sku } : {}),
      ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
      ...(dto.brandId !== undefined ? { brandId: dto.brandId } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(isSet(dto.price) ? { price: dto.price } : {}),
      ...(dto.compareAtPrice !== undefined ? { compareAtPrice: dto.compareAtPrice } : {}),
      ...(dto.currency ? { currency: dto.currency } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(isSet(dto.featured) ? { featured: dto.featured } : {}),
      ...(isSet(dto.stockQuantity) ? { stockQuantity: dto.stockQuantity } : {}),
      ...(dto.stockStatus ? { stockStatus: dto.stockStatus } : {}),
      ...(dto.weightGrams !== undefined ? { weightGrams: dto.weightGrams } : {}),
      ...(isSet(dto.universalFit) ? { universalFit: dto.universalFit } : {}),
      ...(publishing ? { publishedAt: new Date() } : {}),
      updatedById: admin.id,
    };

    await this.writeTransaction(async (tx) => {
      await tx.product.update({ where: { id }, data, select: { id: true } });
      if (dto.specifications) await replaceSpecifications(tx, id, dto.specifications);
      if (compatibility) await replaceCompatibility(tx, id, compatibility);
    });

    this.logger.log(
      {
        adminId: admin.id,
        productId: id,
        fields: Object.keys(dto),
        ...(dto.status ? { status: dto.status } : {}),
      },
      "Product updated",
    );
    return this.get(id);
  }

  /** Products are archived, never hard-deleted: carts, wishlists and orders keep their references. */
  async archive(admin: AuthUser, id: string): Promise<AdminProductDto> {
    const exists = await this.prisma.product.count({ where: { id } });
    if (!exists) throw notFound("Product");
    await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED, updatedById: admin.id },
    });
    this.logger.log({ adminId: admin.id, productId: id }, "Product archived");
    return this.get(id);
  }

  /**
   * Copies a product as a DRAFT. Images are shared with the original (same media
   * assets), which is safe: an asset is only deleted once no product uses it.
   */
  async duplicate(admin: AuthUser, id: string): Promise<AdminProductDto> {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, specifications: true, compatibility: true },
    });
    if (!source) throw notFound("Product");

    const slug = await resolveSlug({
      requested: undefined,
      name: `${source.slug}-copy`,
      entity: "product",
      isTaken: (candidate) => this.slugTaken(candidate),
    });
    const sku = await this.freeSku(`${source.sku}-COPY`);

    const copyId = await this.writeTransaction(async (tx) => {
      const copy = await tx.product.create({
        data: {
          slug,
          sku,
          name: `${source.name} (copy)`.slice(0, 160),
          shortDescription: source.shortDescription,
          description: source.description,
          categoryId: source.categoryId,
          brandId: source.brandId,
          price: source.price,
          compareAtPrice: source.compareAtPrice,
          currency: source.currency,
          status: ProductStatus.DRAFT,
          featured: false,
          stockQuantity: source.stockQuantity,
          stockStatus: source.stockStatus,
          weightGrams: source.weightGrams,
          universalFit: source.universalFit,
          createdById: admin.id,
          updatedById: admin.id,
        },
        select: { id: true },
      });
      if (source.images.length > 0) {
        await tx.productImage.createMany({
          data: source.images.map((image) => ({
            productId: copy.id,
            mediaAssetId: image.mediaAssetId,
            sortOrder: image.sortOrder,
            isPrimary: image.isPrimary,
            altText: image.altText,
            caption: image.caption,
          })),
        });
      }
      await replaceSpecifications(tx, copy.id, source.specifications);
      await replaceCompatibility(tx, copy.id, source.compatibility);
      return copy.id;
    });

    this.logger.log({ adminId: admin.id, productId: copyId, sourceId: id }, "Product duplicated");
    return this.get(copyId);
  }

  // ─── Validation ──────────────────────────────────────────────────────────

  private async assertReferences(dto: UpdateProductDto): Promise<void> {
    if (dto.categoryId) {
      const category = await this.prisma.productCategory.count({ where: { id: dto.categoryId } });
      if (!category) throw invalidReference("categoryId", "The selected category does not exist.");
    }
    if (dto.brandId) {
      const brand = await this.prisma.productBrand.count({ where: { id: dto.brandId } });
      if (!brand) throw invalidReference("brandId", "The selected brand does not exist.");
    }
  }

  private assertPricing(price: number, compareAtPrice: number | null): void {
    if (compareAtPrice !== null && compareAtPrice <= price) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        "Request validation failed.",
        [{ field: "compareAtPrice", messages: ["compareAtPrice must be higher than price"] }],
      );
    }
  }

  private async assertSkuFree(sku: string): Promise<void> {
    if ((await this.prisma.product.count({ where: { sku } })) > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.SKU_TAKEN,
        "Another product already uses this SKU.",
        [{ field: "sku", messages: ["sku is already in use"] }],
      );
    }
  }

  private async slugTaken(slug: string): Promise<boolean> {
    return (await this.prisma.product.count({ where: { slug } })) > 0;
  }

  private async freeSku(base: string): Promise<string> {
    for (let attempt = 1; attempt <= 50; attempt += 1) {
      const candidate = (attempt === 1 ? base : `${base}-${attempt}`).slice(0, 64);
      if ((await this.prisma.product.count({ where: { sku: candidate } })) === 0) return candidate;
    }
    throw new ApiException(
      HttpStatus.CONFLICT,
      ErrorCode.SKU_TAKEN,
      "Could not find a free SKU for the copy.",
    );
  }

  /**
   * Every row must name an existing bike model; a variant must belong to that
   * model. Duplicates are dropped, and a model-wide row makes variant rows for
   * the same model redundant.
   */
  private async validateCompatibility(
    rows: ProductCompatibilityInputDto[],
  ): Promise<CompatibilityRow[]> {
    if (rows.length === 0) return [];
    const modelIds = [...new Set(rows.map((row) => row.bikeModelId))];
    const variantIds = [
      ...new Set(rows.flatMap((row) => (row.bikeVariantId ? [row.bikeVariantId] : []))),
    ];
    const [models, variants] = await Promise.all([
      this.prisma.bikeModel.findMany({ where: { id: { in: modelIds } }, select: { id: true } }),
      this.prisma.bikeVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, modelId: true },
      }),
    ]);
    const knownModels = new Set(models.map((model) => model.id));
    const variantModel = new Map(variants.map((variant) => [variant.id, variant.modelId]));

    rows.forEach((row, index) => {
      if (!knownModels.has(row.bikeModelId)) {
        throw invalidCompatibility(index, "bikeModelId", "This bike model does not exist.");
      }
      if (row.bikeVariantId && variantModel.get(row.bikeVariantId) !== row.bikeModelId) {
        throw invalidCompatibility(
          index,
          "bikeVariantId",
          "This variant does not belong to the selected model.",
        );
      }
    });

    const wholeModels = new Set(
      rows.filter((row) => !row.bikeVariantId).map((row) => row.bikeModelId),
    );
    const seen = new Set<string>();
    return rows.flatMap((row) => {
      const variantId = row.bikeVariantId ?? null;
      if (variantId && wholeModels.has(row.bikeModelId)) return [];
      const key = `${row.bikeModelId}:${variantId ?? "*"}`;
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ bikeModelId: row.bikeModelId, bikeVariantId: variantId, note: row.note ?? null }];
    });
  }

  /** Runs a multi-table write; unique violations that slipped past the pre-checks become 409s. */
  private async writeTransaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(work);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.CONFLICT,
          "Another product was saved with the same SKU or slug at the same time. Try again.",
        );
      }
      throw error;
    }
  }
}

type CompatibilityRow = { bikeModelId: string; bikeVariantId: string | null; note: string | null };

async function replaceSpecifications(
  tx: Prisma.TransactionClient,
  productId: string,
  rows: Pick<ProductSpecificationInputDto, "groupName" | "label" | "value">[],
): Promise<void> {
  await tx.productSpecification.deleteMany({ where: { productId } });
  if (rows.length === 0) return;
  await tx.productSpecification.createMany({
    data: rows.map((row, index) => ({
      productId,
      groupName: row.groupName ?? null,
      label: row.label,
      value: row.value,
      sortOrder: index,
    })),
  });
}

async function replaceCompatibility(
  tx: Prisma.TransactionClient,
  productId: string,
  rows: CompatibilityRow[],
): Promise<void> {
  await tx.productCompatibility.deleteMany({ where: { productId } });
  if (rows.length === 0) return;
  await tx.productCompatibility.createMany({
    data: rows.map((row) => ({
      productId,
      bikeModelId: row.bikeModelId,
      bikeVariantId: row.bikeVariantId,
      note: row.note,
    })),
  });
}

function invalidCompatibility(index: number, field: string, message: string): ApiException {
  return new ApiException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.INVALID_COMPATIBILITY,
    message,
    [{ field: `compatibility.${index}.${field}`, messages: [message] }],
  );
}

function isSet<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
