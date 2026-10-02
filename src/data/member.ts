/**
 * Community and travel-booking content behind "My 36 Spokes". These have no API
 * yet, so there is no real per-rider data to show; everything here is empty on
 * purpose rather than inventing bookings or activity that aren't the signed-in
 * rider's own. Bikes, cart, wishlist and orders (Phase 4) and joined rides
 * (Phase 5) are real account data served by the API.
 *
 * Stored as ids, the way a backend returns them. src/services/member.ts joins
 * these with catalogue data into a MemberOverview.
 */

import type { ActivityItem, Booking, ID, MaintenanceRecord } from "@/types";

export const memberMaintenance: MaintenanceRecord[] = [];

/** Trip bookings arrive with payments. */
export const memberBookings: Booking[] = [];

export const memberGroupIds: ID[] = [];
export const memberStorySlugs: string[] = [];

export const memberActivity: ActivityItem[] = [];
