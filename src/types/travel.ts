import type { Difficulty, ID, ISODate, ISODateTime, RupeeAmount, Slug } from "./common";
import type { MediaAsset } from "./media";
import type { ProductImage } from "./product";

/** A ride linked from a destination or trip page. */
export type RideRef = { slug: Slug; name: string; startsAt: ISODateTime };

export type Destination = {
  id: ID;
  slug: Slug;
  name: string;
  region: string;
  country: string;
  descriptor: string;
  /** Recommended trip length as written by the editor, e.g. "8–12 days". */
  duration: string | null;
  bestSeason: string | null;
  difficulty: Difficulty;
  /** Lowest open departure price of its trips; null when none is scheduled. */
  startingPrice: RupeeAmount | null;
  tripCount: number;
  featured: boolean;
  /** Primary photo, or the no-photo placeholder. */
  image: MediaAsset;
  hasImage: boolean;
};

export type DestinationDetail = Destination & {
  description: string | null;
  usefulInfo: string | null;
  images: ProductImage[];
  rides: RideRef[];
};

export type DepartureStatus = "open" | "full" | "closed";

/** A dated run of a trip. Seat booking arrives with payments. */
export type Departure = {
  id: ID;
  tripId: ID;
  startDate: ISODate;
  endDate: ISODate;
  /** Per rider; null when priced on request. */
  price: RupeeAmount | null;
  seatsTotal: number;
  status: DepartureStatus;
};

/** A fixed itinerary run by 36 Spokes, offered on one or more departures. */
export type Trip = {
  id: ID;
  slug: Slug;
  name: string;
  summary: string;
  destinationSlug: Slug;
  destinationName: string;
  days: number;
  distanceKm: number | null;
  difficulty: Difficulty;
  startLocation: string;
  endLocation: string | null;
  image: MediaAsset;
  hasImage: boolean;
  /** Upcoming departures, earliest first. */
  departures: Departure[];
};

export type ItineraryDay = {
  id: ID;
  dayNumber: number;
  title: string;
  description: string | null;
  routeSummary: string | null;
  distanceKm: number | null;
  accommodation: string | null;
  notes: string | null;
};

export type TripDetail = Trip & {
  description: string | null;
  itinerary: ItineraryDay[];
  images: ProductImage[];
  rides: RideRef[];
};
