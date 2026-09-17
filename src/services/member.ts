/**
 * Garage, travel, shop and community data for the signed-in rider. Identity
 * (name, email) comes from the authenticated user (`@/state/auth`), not from
 * here. These domains have no API yet, so this always returns sample content
 * until Garage, Travel, Shop and Community land on the backend.
 */

import { groups } from "@/data/groups";
import {
  memberActivity,
  memberBookings,
  memberGroupIds,
  memberMaintenance,
  memberOrders,
  memberProfile,
  memberSavedRideIds,
  memberSavedTripIds,
  memberStorySlugs,
  memberUpcomingRideId,
} from "@/data/member";
import { rides } from "@/data/rides";
import { stories } from "@/data/stories";
import { trips } from "@/data/trips";
import type { Booking, BookingSummary, MemberOverview } from "@/types";

function toBookingSummary(booking: Booking): BookingSummary | null {
  const trip = trips.find((entry) => entry.id === booking.tripId);
  const departure = trip?.departures.find((entry) => entry.id === booking.departureId);
  return trip && departure ? { ...booking, trip, departure } : null;
}

const isPresent = <T>(value: T | null): value is T => value !== null;

export async function getMemberOverview(): Promise<MemberOverview> {
  const bookings = memberBookings.map(toBookingSummary).filter(isPresent);

  return {
    profile: memberProfile,
    // Garage has no API yet, so there's no real bike on the account to show.
    primaryBike: null,
    bikes: [],
    maintenance: [...memberMaintenance],
    // The trip-readiness checklist isn't tied to a real rider's gear yet.
    setupChecklist: [],
    upcomingRide: rides.find((ride) => ride.id === memberUpcomingRideId) ?? null,
    upcomingBooking:
      bookings.find((booking) => booking.status === "confirmed") ?? bookings[0] ?? null,
    bookings,
    savedRides: rides.filter((ride) => memberSavedRideIds.includes(ride.id)),
    savedTrips: trips.filter((trip) => memberSavedTripIds.includes(trip.id)),
    orders: [...memberOrders],
    groups: groups.filter((group) => memberGroupIds.includes(group.id)),
    stories: stories.filter((story) => memberStorySlugs.includes(story.slug)),
    activity: [...memberActivity],
  };
}
