import type { Difficulty, ID, Slug } from "./common";

export type RideType = "Weekend" | "Day Ride" | "Group Ride" | "Event";

/** URL-safe form of a ride type, used in `/rides?type=`. */
export type RideTypeSlug = "weekend" | "day-ride" | "group-ride" | "event";

/**
 * The road a ride follows. Named RideRoute so it never collides with the
 * `Route` export every TanStack route file declares.
 */
export type RideRoute = {
  start: string;
  finish: string;
  waypoints: string[];
  distanceKm: number;
};

export type Ride = {
  id: ID;
  slug: Slug;
  name: string;
  type: RideType;
  location: string;
  summary: string;
  meetingPoint: string;
  route: RideRoute;
  /** Display label, e.g. "5 hrs" or "2 days". */
  duration: string;
  difficulty: Difficulty;
  riders: number;
};
