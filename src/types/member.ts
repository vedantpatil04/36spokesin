import type { Bike } from "./bike";
import type { Booking } from "./commerce";
import type { ID } from "./common";
import type { MaintenanceRecord, OwnedBike, SetupCheckItem } from "./garage";
import type { Group } from "./group";
import type { Ride } from "./ride";
import type { Story } from "./story";
import type { Departure, Trip } from "./travel";

export type ActivityItem = {
  id: ID;
  label: string;
};

/** An owned bike joined with its catalogue entry. */
export type GarageBike = OwnedBike & { bike: Bike };

/** A booking joined with the trip and departure it refers to. */
export type BookingSummary = Booking & { trip: Trip; departure: Departure };

/**
 * Rides, travel and community content for "My 36 Spokes". Identity comes from
 * the authenticated user; the rider's bikes, cart, wishlist and orders come
 * from the API through `@/state` and `@/services` (Phase 4), not from here.
 */
export type MemberOverview = {
  maintenance: MaintenanceRecord[];
  setupChecklist: SetupCheckItem[];
  upcomingBooking: BookingSummary | null;
  bookings: BookingSummary[];
  savedRides: Ride[];
  savedTrips: Trip[];
  groups: Group[];
  stories: Story[];
  activity: ActivityItem[];
};
