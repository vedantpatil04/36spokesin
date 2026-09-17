import type { ID, Slug } from "./common";
import type { MediaAsset } from "./media";

/** A local 36 Spokes crew that hosts rides and meetups. */
export type Group = {
  id: ID;
  slug: Slug;
  name: string;
  city: string;
  description: string;
  memberCount: number;
  /** Display label, e.g. "Sunday mornings". */
  rideCadence: string;
  image: MediaAsset;
};
