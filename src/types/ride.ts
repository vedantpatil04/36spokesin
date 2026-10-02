import type { Difficulty, ID, ISODateTime, RupeeAmount, Slug } from "./common";
import type { MediaAsset } from "./media";
import type { ProductImage } from "./product";

export type RideType = "Weekend" | "Day Ride" | "Group Ride" | "Event";

/** URL-safe form of a ride type, used in `/rides?type=`. */
export type RideTypeSlug = "weekend" | "day-ride" | "group-ride" | "event";

/** Public ride statuses (drafts and archived rides never reach the site). */
export type RideStatus = "upcoming" | "full" | "completed" | "cancelled";

/**
 * The road a ride follows. Named RideRoute so it never collides with the
 * `Route` export every TanStack route file declares.
 */
export type RideRoute = {
  start: string | null;
  finish: string | null;
  waypoints: string[];
  distanceKm: number | null;
};

export type Ride = {
  id: ID;
  slug: Slug;
  name: string;
  type: RideType;
  location: string;
  summary: string;
  meetingPoint: string;
  startsAt: ISODateTime;
  route: RideRoute;
  routeSummary: string | null;
  /** Display label, e.g. "5 hrs" or "2 days". */
  duration: string | null;
  difficulty: Difficulty;
  rideLeader: string | null;
  status: RideStatus;
  /** Marked by an admin to lead the rides page. */
  featured: boolean;
  capacity: number;
  /** Per rider; null when the ride is free. */
  price: RupeeAmount | null;
  registeredCount: number;
  spotsLeft: number;
  /** Taking riders right now (upcoming, not started, not full). Decided by the API. */
  registrationOpen: boolean;
  image: MediaAsset;
  hasImage: boolean;
  destination: { slug: Slug; name: string } | null;
  trip: { slug: Slug; name: string } | null;
};

export type RideDetail = Ride & { description: string | null; images: ProductImage[] };

/**
 * Where a booking stands, as the rider sees it. Everything except `cancelled`
 * holds a seat. The three payment states apply to paid rides only: the seat is
 * held while the rider pays and an admin verifies the proof.
 */
export type RideBookingStatus =
  "payment-required" | "payment-under-review" | "payment-rejected" | "confirmed" | "cancelled";

/** Where to send money for a paid ride, as set by the crew. */
export type PaymentInfo = {
  configured: boolean;
  upiId: string | null;
  payeeName: string | null;
  instructions: string | null;
  qrUrl: string | null;
  /** Minutes a seat is held while the rider pays. */
  holdMinutes: number;
};

/** The signed-in rider's booking on one ride. Only `registered` bookings hold a spot. */
export type RideRegistration = {
  rideId: ID;
  registered: boolean;
  /** Null when the rider has never booked this ride. */
  status: RideBookingStatus | null;
  /** Null until the rider has booked this ride at least once. */
  bookingNumber: number | null;
  /** Booking ID to quote, e.g. "36S-000042". */
  reference: string | null;
  contactPhone: string | null;
  bikeLabel: string | null;
  note: string | null;
  /** Price per rider quoted when booking; null for a free ride. Not a payment. */
  amount: RupeeAmount | null;
  /** An admin has verified the payment for this booking. */
  paymentVerified: boolean;
  /** While payment is due and no proof is in: when the held seat is released. */
  holdExpiresAt: ISODateTime | null;
  /** Cancelled because the seat hold ran out, not by the rider. */
  holdExpired: boolean;
  /** Why the latest proof was rejected, when the admin gave a reason. */
  paymentRejectionReason: string | null;
  registeredAt: ISODateTime | null;
  cancelledAt: ISODateTime | null;
};

/** What the rider fills in to book. Name and email come from their account. */
export type RideBookingInput = {
  contactPhone: string;
  /** One of the rider's own garage bikes, or null when not chosen. */
  riderBikeId: ID | null;
  note: string | null;
};

/** One of the signed-in rider's bookings, active or cancelled, with its ride. */
export type MyRide = {
  ride: Ride;
  bookingNumber: number;
  reference: string;
  status: RideBookingStatus;
  registeredAt: ISODateTime;
  cancelledAt: ISODateTime | null;
};
