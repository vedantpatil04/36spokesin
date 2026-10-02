import type { ID, Slug } from "./common";

export type Rider = {
  id: ID;
  slug: Slug;
  name: string;
  /** Display label for the rider's main bike. */
  bike: string;
  bikeId?: ID;
  location: string;
  kmThisYear: number;
  ridesLed: number;
};
