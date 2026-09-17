import type { Bike } from "./bike";
import type { Booking, Order } from "./commerce";
import type { ID } from "./common";
import type { MaintenanceRecord, OwnedBike, SetupCheckItem } from "./garage";
import type { Group } from "./group";
import type { Ride } from "./ride";
import type { RiderProfile } from "./rider";
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
 * What "My 36 Spokes" needs about the signed-in rider, aside from identity
 * (name, email), which comes from the authenticated user, not this overview.
 * Assembled by the member service.
 */
export type MemberOverview = {
  profile: RiderProfile;
  /** Null until Garage has an API — no bike is actually on the rider's account yet. */
  primaryBike: GarageBike | null;
  bikes: GarageBike[];
  maintenance: MaintenanceRecord[];
  setupChecklist: SetupCheckItem[];
  upcomingRide: Ride | null;
  upcomingBooking: BookingSummary | null;
  bookings: BookingSummary[];
  savedRides: Ride[];
  savedTrips: Trip[];
  orders: Order[];
  groups: Group[];
  stories: Story[];
  activity: ActivityItem[];
};
