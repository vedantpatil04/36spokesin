import { destinations } from "@/data/destinations";
import { trips } from "@/data/trips";
import { nextDeparture } from "@/lib/travel";
import type { Destination, Trip } from "@/types";

export async function listDestinations(): Promise<Destination[]> {
  return [...destinations];
}

export async function getDestination(slug: string): Promise<Destination | null> {
  return destinations.find((destination) => destination.slug === slug) ?? null;
}

/** Trips ordered by their next departure. */
export async function listTrips(filter: { destinationSlug?: string } = {}): Promise<Trip[]> {
  const { destinationSlug } = filter;
  const list = destinationSlug
    ? trips.filter((trip) => trip.destinationSlug === destinationSlug)
    : [...trips];
  return list.sort((a, b) =>
    (nextDeparture(a)?.startDate ?? "").localeCompare(nextDeparture(b)?.startDate ?? ""),
  );
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  return trips.find((trip) => trip.slug === slug) ?? null;
}
