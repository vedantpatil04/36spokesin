/**
 * Signed-in rider data. Phase 2 always returns the sample member; Phase 3
 * resolves the session and queries by rider id.
 */

import { bikes } from "@/data/bikes";
import { groups } from "@/data/groups";
import {
  memberActivity,
  memberBikes,
  memberBookings,
  memberGreeting,
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
import { getSetupChecklist } from "@/services/site";
import type { Booking, BookingSummary, GarageBike, MemberOverview, OwnedBike } from "@/types";

function toGarageBike(owned: OwnedBike): GarageBike | null {
  const bike = bikes.find((entry) => entry.id === owned.bikeId);
  return bike ? { ...owned, bike } : null;
}

function toBookingSummary(booking: Booking): BookingSummary | null {
  const trip = trips.find((entry) => entry.id === booking.tripId);
  const departure = trip?.departures.find((entry) => entry.id === booking.departureId);
  return trip && departure ? { ...booking, trip, departure } : null;
}

const isPresent = <T>(value: T | null): value is T => value !== null;

export async function getMemberOverview(): Promise<MemberOverview> {
  const garageBikes = memberBikes.map(toGarageBike).filter(isPresent);
  const primaryBike = garageBikes[0];
  if (!primaryBike) throw new Error("Sample member has no registered bike.");

  const bookings = memberBookings.map(toBookingSummary).filter(isPresent);

  return {
    profile: memberProfile,
    greeting: memberGreeting,
    primaryBike,
    bikes: garageBikes,
    maintenance: [...memberMaintenance],
    setupChecklist: await getSetupChecklist(),
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
