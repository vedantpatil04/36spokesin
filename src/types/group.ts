import type { ID, Slug } from "./common";
import type { MediaAsset } from "./media";

/** A local 36 Spokes group or chapter. Unknown details are null, never guessed. */
export type Group = {
  id: ID;
  slug: Slug;
  name: string;
  /** Where the group rides from, e.g. "Pune, Maharashtra". */
  city: string | null;
  description: string | null;
  /** Null when the number isn't actually known. */
  memberCount: number | null;
  /** Display label, e.g. "Sunday mornings". */
  rideCadence: string | null;
  image: MediaAsset;
  /** False when `image` is the no-photo placeholder. */
  hasImage?: boolean;
};
