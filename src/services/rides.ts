import { rides, rideTypes } from "@/data/rides";
import type { Ride, RideType, RideTypeSlug } from "@/types";

export async function listRides(filter: { type?: RideTypeSlug } = {}): Promise<Ride[]> {
  const label = filter.type ? rideTypeLabel(filter.type) : undefined;
  return label ? rides.filter((ride) => ride.type === label) : [...rides];
}

export async function getRideBySlug(slug: string): Promise<Ride | null> {
  return rides.find((ride) => ride.slug === slug) ?? null;
}

export function listRideTypes(): { slug: RideTypeSlug; label: RideType }[] {
  return rideTypes;
}

export function rideTypeLabel(slug: RideTypeSlug): RideType | undefined {
  return rideTypes.find((type) => type.slug === slug)?.label;
}

/** Narrows an untrusted URL value to a known ride type slug. */
export function parseRideTypeSlug(value: unknown): RideTypeSlug | undefined {
  return rideTypes.find((type) => type.slug === value)?.slug;
}
