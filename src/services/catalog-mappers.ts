/**
 * API → UI model mapping for the catalogue. Components only ever see `@/types`
 * shapes; image URLs, alt text and money conversion are settled here.
 */

import { media } from "@/data/media";
import type {
  ApiBikeModel,
  ApiBikeSegment,
  ApiCategory,
  ApiImage,
  ApiProductDetail,
  ApiProductSummary,
  ApiRiderBike,
  ApiStockStatus,
} from "@/lib/api";
import { minorToRupees } from "@/lib/money";
import type {
  Bike,
  BikeSegment,
  GarageBike,
  MediaAsset,
  MediaCategory,
  Product,
  ProductCategory,
  ProductDetail,
  StockStatus,
} from "@/types";

const SEGMENT_LABEL: Record<ApiBikeSegment, BikeSegment> = {
  ADVENTURE: "Adventure",
  SCRAMBLER: "Scrambler",
  TOURING: "Touring",
  STREET: "Street",
  CRUISER: "Cruiser",
  SPORT: "Sport",
};

const STOCK_STATUS: Record<ApiStockStatus, StockStatus> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  BACKORDER: "backorder",
};

/** Uploaded image → MediaAsset. Null when the image has no public URL (storage off). */
export function toMediaAsset(
  image: ApiImage | null | undefined,
  category: MediaCategory,
  fallbackAlt: string,
): MediaAsset | null {
  if (!image?.url) return null;
  return {
    src: image.url,
    alt: image.altText ?? fallbackAlt,
    // Reserve a sensible box when the upload's dimensions weren't readable.
    width: image.width ?? 1200,
    height: image.height ?? 1200,
    category,
  };
}

export function toProduct(api: ApiProductSummary): Product {
  const image = toMediaAsset(api.primaryImage, "products", api.name);
  return {
    id: api.id,
    slug: api.slug,
    sku: api.sku,
    name: api.name,
    summary: api.shortDescription ?? "",
    brand: api.brand ? { slug: api.brand.slug, name: api.brand.name } : null,
    category: { slug: api.category.slug, name: api.category.name },
    price: minorToRupees(api.price),
    compareAtPrice: api.compareAtPrice !== null ? minorToRupees(api.compareAtPrice) : null,
    stockStatus: STOCK_STATUS[api.stockStatus],
    stockQuantity: api.stockQuantity,
    maxOrderQuantity: api.maxOrderQuantity,
    inStock: api.maxOrderQuantity > 0,
    fitment: api.universalFit
      ? { kind: "universal" }
      : {
          kind: "bikes",
          fits: api.fits.map((fit) => ({ bikeId: fit.bikeModelId, variantId: fit.bikeVariantId })),
        },
    image: image ?? { ...media.placeholders.product, alt: `${api.name}, no photo yet` },
    hasImage: image !== null,
  };
}

export function toProductDetail(api: ApiProductDetail): ProductDetail {
  return {
    ...toProduct(api),
    description: api.description,
    weightGrams: api.weightGrams,
    images: api.images.flatMap((image) => {
      const asset = toMediaAsset(image, "products", api.name);
      return asset
        ? [{ id: image.id, asset, caption: image.caption, isPrimary: image.isPrimary }]
        : [];
    }),
    specifications: api.specifications.map((spec) => ({
      id: spec.id,
      group: spec.groupName,
      label: spec.label,
      value: spec.value,
    })),
    // Archived bikes are no longer in the catalogue, so the storefront doesn't list them.
    compatibility: api.compatibility
      .filter((fit) => !fit.archived)
      .map((fit) => ({
        bikeId: fit.bikeModelId,
        bikeSlug: fit.bikeModelSlug,
        name: `${fit.brandName} ${fit.bikeModelName}`,
        variantId: fit.bikeVariantId,
        variantName: fit.bikeVariantName,
        note: fit.note,
      })),
  };
}

export function toBike(api: ApiBikeModel): Bike {
  const variants = api.variants.filter((variant) => variant.archivedAt === null);
  const name = `${api.brand.name} ${api.name}`;
  return {
    id: api.id,
    slug: api.slug,
    brand: api.brand.name,
    model: api.name,
    variant: variants[0]?.name ?? "",
    variants: variants.map((variant) => ({ id: variant.id, name: variant.name })),
    segment: SEGMENT_LABEL[api.segment],
    image: toMediaAsset(api.image, "bikes", name) ?? {
      ...media.placeholders.bike,
      alt: `${name}, no photo yet`,
    },
    fuelEfficiencyKmpl: api.fuelEfficiencyKmpl,
    tankLitres: api.tankLitres,
    displacementCc: api.displacementCc,
    description: api.description,
  };
}

export function toCategory(api: ApiCategory): ProductCategory {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    purpose: api.description ?? "",
    image: toMediaAsset(api.image, "products", api.name),
    productCount: api.productCount,
  };
}

export function toGarageBike(api: ApiRiderBike): GarageBike {
  return {
    id: api.id,
    bikeId: api.bike.id,
    variantId: api.bikeVariantId,
    variantName: api.bikeVariantName,
    nickname: api.nickname,
    year: api.year,
    odometerKm: api.odometerKm,
    isPrimary: api.isPrimary,
    archived: api.archived,
    addedAt: api.createdAt,
    bike: toBike(api.bike),
  };
}
