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

/** The signed-in rider's own profile. */
export type RiderProfile = {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  memberSince: string;
};
