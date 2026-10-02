import type { ID, RupeeAmount, Slug } from "./common";
import type { MediaAsset } from "./media";

/**
 * Categories are grouped by what the gear does on a ride, not by brand. They are
 * managed in the admin CMS, so the slug is any string the API returns.
 */
export type ProductCategorySlug = Slug;

export type ProductCategory = {
  id: ID;
  slug: ProductCategorySlug;
  name: string;
  /** One line on what the category holds, e.g. "Helmets, armour, guards". */
  purpose: string;
  /** Null until an admin uploads one; UI falls back to a site image. */
  image: MediaAsset | null;
  productCount: number;
};

/** The category fields a product carries with it, so lists render without a join. */
export type ProductCategoryRef = Pick<ProductCategory, "slug" | "name">;

export type ProductBrandRef = { slug: Slug; name: string };

/** A bike (model) a product is confirmed to fit, optionally narrowed to one variant. */
export type ProductFit = { bikeId: ID; variantId: ID | null };

/**
 * Which motorcycles a product fits. Rider gear (helmets, tool rolls) is universal;
 * bike-mounted parts list the bike models (and optionally variants) they fit.
 */
export type ProductFitment = { kind: "universal" } | { kind: "bikes"; fits: ProductFit[] };

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "backorder";

export type Product = {
  id: ID;
  slug: Slug;
  sku: string;
  name: string;
  summary: string;
  brand: ProductBrandRef | null;
  category: ProductCategoryRef;
  price: RupeeAmount;
  /** Shown struck through when set. */
  compareAtPrice: RupeeAmount | null;
  stockStatus: StockStatus;
  stockQuantity: number;
  /** Most units a rider can put in their cart right now. */
  maxOrderQuantity: number;
  /** Purchasable right now. */
  inStock: boolean;
  fitment: ProductFitment;
  /** The primary image, or a neutral placeholder when the product has none yet. */
  image: MediaAsset;
  hasImage: boolean;
};

export type ProductImage = {
  id: ID;
  asset: MediaAsset;
  caption: string | null;
  isPrimary: boolean;
};

export type ProductSpecification = {
  id: ID;
  group: string | null;
  label: string;
  value: string;
};

export type CompatibleBike = {
  bikeId: ID;
  bikeSlug: Slug;
  /** "Royal Enfield Himalayan 450" */
  name: string;
  variantId: ID | null;
  variantName: string | null;
  note: string | null;
};

export type ProductDetail = Product & {
  description: string | null;
  weightGrams: number | null;
  /** In display order. Empty when no photos have been uploaded. */
  images: ProductImage[];
  specifications: ProductSpecification[];
  compatibility: CompatibleBike[];
};

export type ProductPage = { products: Product[]; nextCursor: string | null };
