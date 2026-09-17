import type { ID, RupeeAmount, Slug } from "./common";
import type { MediaAsset } from "./media";

/** Categories are grouped by what the gear does on a ride, not by brand. */
export type ProductCategorySlug = "protect" | "carry" | "navigate" | "light" | "ride" | "prepare";

export type ProductCategory = {
  slug: ProductCategorySlug;
  name: string;
  purpose: string;
  image: MediaAsset;
};

/** The category fields a product carries with it, so lists render without a join. */
export type ProductCategoryRef = Pick<ProductCategory, "slug" | "name">;

/**
 * Which motorcycles a product fits. Rider gear (helmets, tool rolls) is universal;
 * bike-mounted parts list the bike ids they are confirmed to fit.
 */
export type ProductFitment = { kind: "universal" } | { kind: "bikes"; bikeIds: ID[] };

export type Product = {
  id: ID;
  slug: Slug;
  name: string;
  summary: string;
  category: ProductCategoryRef;
  price: RupeeAmount;
  rating: number;
  reviews: number;
  fitment: ProductFitment;
  inStock: boolean;
  image: MediaAsset;
};
