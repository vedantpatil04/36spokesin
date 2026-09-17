/**
 * Garage, travel, shop and community content behind "My 36 Spokes", for the
 * signed-in rider's account. Identity (name, email) is real — it comes from
 * the authenticated user. These domains have no API yet, so there is no real
 * per-rider data to show; everything here is empty on purpose rather than
 * inventing bikes, bookings, orders or activity that aren't actually the
 * signed-in rider's own.
 *
 * Stored as ids, the way a backend returns them. src/services/member.ts joins
 * these with catalogue data into a MemberOverview.
 */

import type {
  ActivityItem,
  Booking,
  ID,
  MaintenanceRecord,
  Order,
  OwnedBike,
  RiderProfile,
} from "@/types";

export const memberProfile: RiderProfile = {
  city: "Pune",
  memberSince: "2022",
};

export const memberBikes: OwnedBike[] = [];

export const memberMaintenance: MaintenanceRecord[] = [];

export const memberUpcomingRideId: ID | null = null;

export const memberBookings: Booking[] = [];

export const memberSavedRideIds: ID[] = [];
export const memberSavedTripIds: ID[] = [];
export const memberGroupIds: ID[] = [];
export const memberStorySlugs: string[] = [];

export const memberOrders: Order[] = [];

export const memberActivity: ActivityItem[] = [];
