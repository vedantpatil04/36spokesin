import type { ID, Slug } from "./common";
import type { MediaAsset } from "./media";

export type BikeSegment = "Adventure" | "Scrambler" | "Touring" | "Street" | "Cruiser";

/** A purchasable configuration of a model (trim, colourway or edition). */
export type BikeVariant = {
  id: ID;
  name: string;
};

/** A motorcycle model in the catalogue. Fitment and planning are keyed on `id`. */
export type Bike = {
  id: ID;
  slug: Slug;
  brand: string;
  model: string;
  /** Display name of the featured variant. */
  variant: string;
  variants: BikeVariant[];
  segment: BikeSegment;
  image: MediaAsset;
  /** Approximate real-world figures. Used by the journey planner for fuel range. */
  fuelEfficiencyKmpl: number;
  tankLitres: number;
};
