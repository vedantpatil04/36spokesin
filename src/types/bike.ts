import type { ID, Slug } from "./common";
import type { MediaAsset } from "./media";

export type BikeSegment = "Adventure" | "Scrambler" | "Touring" | "Street" | "Cruiser" | "Sport";

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
  /** Display name of the featured (first) variant; empty when none are listed. */
  variant: string;
  variants: BikeVariant[];
  segment: BikeSegment;
  image: MediaAsset;
  /** Approximate real-world figures. Null when the catalogue doesn't list them. */
  fuelEfficiencyKmpl: number | null;
  tankLitres: number | null;
  displacementCc?: number | null;
  description?: string | null;
};
