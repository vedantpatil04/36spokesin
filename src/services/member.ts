/**
 * Community and trip-booking data for the signed-in rider. Those have no API
 * yet, so the lists are empty rather than invented. Identity comes from
 * `@/state/auth`; bikes, cart, wishlist and orders from `@/state` (Phase 4);
 * joined rides from `listMyRides()` in `@/services/rides` (Phase 5).
 */

import { memberActivity, memberMaintenance } from "@/data/member";
import type { BookingSummary, MemberOverview } from "@/types";

export async function getMemberOverview(): Promise<MemberOverview> {
  // Trip booking arrives with payments; until then there's nothing to resolve.
  const bookings: BookingSummary[] = [];

  return {
    maintenance: [...memberMaintenance],
    // The trip-readiness checklist isn't tied to a real rider's gear yet.
    setupChecklist: [],
    upcomingBooking:
      bookings.find((booking) => booking.status === "confirmed") ?? bookings[0] ?? null,
    bookings,
    // Saving rides and trips isn't built yet.
    savedRides: [],
    savedTrips: [],
    // Group membership and rider-authored stories aren't built yet (Phase 6
    // groups and stories are admin-managed), so these stay empty.
    groups: [],
    stories: [],
    activity: [...memberActivity],
  };
}
