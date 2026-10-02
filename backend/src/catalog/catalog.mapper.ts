import { Injectable } from "@nestjs/common";
import type { MediaAsset, Prisma } from "../generated/prisma/client.js";
import { MediaStatus } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import type {
  AdminProductDto,
  AdminProductListItemDto,
  CatalogRefDto,
  ImageDto,
  ProductDetailDto,
  ProductImageDto,
  ProductSummaryDto,
} from "./dto/catalog-response.dto.js";
import { maxOrderQuantity } from "./product-rules.js";

const refSelect = { select: { id: true, slug: true, name: true } } as const;

export const productImageInclude = {
  mediaAsset: true,
} satisfies Prisma.ProductImageInclude;

/** Everything a product card needs, in one query. */
export const productSummaryInclude = {
  brand: refSelect,
  category: refSelect,
  images: { where: { isPrimary: true }, take: 1, include: productImageInclude },
  compatibility: { select: { bikeModelId: true, bikeVariantId: true } },
} satisfies Prisma.ProductInclude;

export const productDetailInclude = {
  brand: refSelect,
  category: refSelect,
  images: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: productImageInclude },
  specifications: { orderBy: { sortOrder: "asc" } },
  compatibility: {
    orderBy: { createdAt: "asc" },
    include: {
      bikeModel: { include: { brand: { select: { name: true, archivedAt: true } } } },
      bikeVariant: { select: { name: true, archivedAt: true } },
    },
  },
} satisfies Prisma.ProductInclude;

export const adminProductListInclude = {
  brand: refSelect,
  category: refSelect,
  images: { where: { isPrimary: true }, take: 1, include: productImageInclude },
  _count: { select: { images: true } },
} satisfies Prisma.ProductInclude;

export type ProductSummaryRow = Prisma.ProductGetPayload<{ include: typeof productSummaryInclude }>;
export type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;
export type AdminProductListRow = Prisma.ProductGetPayload<{
  include: typeof adminProductListInclude;
}>;
export type ProductImageRow = Prisma.ProductImageGetPayload<{
  include: typeof productImageInclude;
}>;

/** Turns catalogue rows into API shapes. Image URLs come from the configured storage. */
@Injectable()
export class CatalogMapper {
  constructor(private readonly media: MediaService) {}

  image(asset: MediaAsset, altOverride?: string | null): ImageDto {
    return {
      id: asset.id,
      url: asset.status === MediaStatus.READY ? this.media.publicUrl(asset.storageKey) : null,
      width: asset.width,
      height: asset.height,
      altText: altOverride ?? asset.altText,
    };
  }

  productImage(row: ProductImageRow): ProductImageDto {
    return {
      ...this.image(row.mediaAsset, row.altText),
      id: row.id,
      mediaAssetId: row.mediaAssetId,
      caption: row.caption,
      sortOrder: row.sortOrder,
      isPrimary: row.isPrimary,
    };
  }

  summary(row: ProductSummaryRow): ProductSummaryDto {
    const primary = row.images[0];
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      shortDescription: row.shortDescription,
      brand: row.brand ? ref(row.brand) : null,
      category: ref(row.category),
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      currency: row.currency,
      stockStatus: row.stockStatus,
      stockQuantity: row.stockQuantity,
      maxOrderQuantity: maxOrderQuantity(row),
      featured: row.featured,
      universalFit: row.universalFit,
      fits: row.compatibility.map((fit) => ({
        bikeModelId: fit.bikeModelId,
        bikeVariantId: fit.bikeVariantId,
      })),
      primaryImage: primary ? this.productImage(primary) : null,
      publishedAt: row.publishedAt,
    };
  }

  detail(row: ProductDetailRow): ProductDetailDto {
    const images = row.images.map((image) => this.productImage(image));
    return {
      ...this.summary({
        ...row,
        images: row.images.filter((image) => image.isPrimary),
        compatibility: row.compatibility,
      }),
      description: row.description,
      weightGrams: row.weightGrams,
      images,
      specifications: row.specifications.map((spec) => ({
        id: spec.id,
        groupName: spec.groupName,
        label: spec.label,
        value: spec.value,
        sortOrder: spec.sortOrder,
      })),
      compatibility: row.compatibility.map((fit) => ({
        bikeModelId: fit.bikeModelId,
        bikeModelSlug: fit.bikeModel.slug,
        bikeModelName: fit.bikeModel.name,
        brandName: fit.bikeModel.brand.name,
        bikeVariantId: fit.bikeVariantId,
        bikeVariantName: fit.bikeVariant?.name ?? null,
        note: fit.note,
        archived: Boolean(
          fit.bikeModel.archivedAt ?? fit.bikeModel.brand.archivedAt ?? fit.bikeVariant?.archivedAt,
        ),
      })),
    };
  }

  adminDetail(row: ProductDetailRow): AdminProductDto {
    return {
      ...this.detail(row),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdById: row.createdById,
      updatedById: row.updatedById,
    };
  }

  adminListItem(row: AdminProductListRow): AdminProductListItemDto {
    const primary = row.images[0];
    return {
      id: row.id,
      slug: row.slug,
      sku: row.sku,
      name: row.name,
      status: row.status,
      category: ref(row.category),
      brand: row.brand ? ref(row.brand) : null,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      currency: row.currency,
      stockQuantity: row.stockQuantity,
      stockStatus: row.stockStatus,
      featured: row.featured,
      primaryImage: primary ? this.productImage(primary) : null,
      imageCount: row._count.images,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    };
  }
}

function ref(value: { id: string; slug: string; name: string }): CatalogRefDto {
  return { id: value.id, slug: value.slug, name: value.name };
}
