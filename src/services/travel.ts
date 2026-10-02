/**
 * Destinations and trips from the 36 Spokes API. Public endpoints: safe in SSR
 * route loaders. Admins manage this content in the CMS.
 */

import { getApiClient } from "@/lib/api";
import type {
  ApiDestinationDetail,
  ApiDestinationSummary,
  ApiTripDetail,
  ApiTripSummary,
} from "@/lib/api";
import type { Destination, DestinationDetail, Trip, TripDetail } from "@/types";
import { orNull } from "./request-helpers";
import { toDestination, toDestinationDetail, toTrip, toTripDetail } from "./travel-mappers";

export async function listDestinations(
  filter: { featured?: boolean } = {},
): Promise<Destination[]> {
  const rows = await getApiClient().request<ApiDestinationSummary[]>("/destinations", {
    auth: false,
    query: { featured: filter.featured },
  });
  return rows.map(toDestination);
}

export async function getDestination(slug: string): Promise<DestinationDetail | null> {
  const row = await orNull(
    getApiClient().request<ApiDestinationDetail>(`/destinations/${encodeURIComponent(slug)}`, {
      auth: false,
    }),
  );
  return row ? toDestinationDetail(row) : null;
}

/** Published trips, soonest departure first. */
export async function listTrips(filter: { destinationSlug?: string } = {}): Promise<Trip[]> {
  const rows = await getApiClient().request<ApiTripSummary[]>("/trips", {
    auth: false,
    query: { destination: filter.destinationSlug },
  });
  return rows.map(toTrip);
}

export async function getTripBySlug(slug: string): Promise<TripDetail | null> {
  const row = await orNull(
    getApiClient().request<ApiTripDetail>(`/trips/${encodeURIComponent(slug)}`, { auth: false }),
  );
  return row ? toTripDetail(row) : null;
}
