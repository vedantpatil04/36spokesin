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

/**
 * Rider-domain profile fields with no API yet (My 36 Spokes preview only).
 * Identity (name, email) comes from the authenticated user instead — see
 * `useAuthUser()` in `@/state/auth` — never from this mock shape.
 */
export type RiderProfile = {
  city: string;
  memberSince: string;
};
