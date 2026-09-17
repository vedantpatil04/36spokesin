import type { Difficulty, ID, ISODate, RupeeAmount, Slug } from "./common";
import type { MediaAsset } from "./media";

export type Destination = {
  slug: Slug;
  name: string;
  region: string;
  descriptor: string;
  /** Typical length of an expedition to this region. */
  days: number;
  difficulty: Difficulty;
  startingPrice: RupeeAmount;
  image: MediaAsset;
};

export type DepartureStatus = "open" | "filling" | "full" | "closed";

/** A dated, bookable instance of a trip. */
export type Departure = {
  id: ID;
  tripId: ID;
  startDate: ISODate;
  endDate: ISODate;
  price: RupeeAmount;
  seatsTotal: number;
  seatsLeft: number;
  status: DepartureStatus;
};

/** A fixed itinerary run by 36 Spokes, offered on one or more departures. */
export type Trip = {
  id: ID;
  slug: Slug;
  name: string;
  destinationSlug: Slug;
  destinationName: string;
  days: number;
  distanceKm: number;
  difficulty: Difficulty;
  startLocation: string;
  image: MediaAsset;
  /** Sorted by start date, earliest first. */
  departures: Departure[];
};
