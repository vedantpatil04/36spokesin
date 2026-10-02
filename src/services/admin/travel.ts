/** Admin CMS: destinations, trips and rides. Returns API shapes; see ./catalog.ts. */

import { getApiClient } from "@/lib/api";
import type {
  ApiAdminDestination,
  ApiAdminRide,
  ApiAdminRideBooking,
  ApiAdminTrip,
  ApiContentStatus,
  ApiDepartureStatus,
  ApiDifficulty,
  ApiRideStatus,
  ApiRideType,
} from "@/lib/api";

const api = () => getApiClient();

export type DestinationInput = {
  name: string;
  slug?: string;
  region: string;
  country: string;
  difficulty: ApiDifficulty;
  shortDescription: string | null;
  description: string | null;
  bestSeason: string | null;
  durationRecommendation: string | null;
  usefulInfo: string | null;
  status: ApiContentStatus;
  featured: boolean;
};

export type ItineraryDayInput = {
  title: string;
  description: string | null;
  routeSummary: string | null;
  distanceKm: number | null;
  accommodation: string | null;
  notes: string | null;
};

export type DepartureInput = {
  id?: string;
  startDate: string;
  endDate: string;
  price: number | null;
  capacity: number;
  status: ApiDepartureStatus;
};

export type TripInput = {
  name: string;
  slug?: string;
  destinationId: string;
  durationDays: number;
  distanceKm: number | null;
  difficulty: ApiDifficulty;
  startingLocation: string;
  endingLocation: string | null;
  shortDescription: string | null;
  description: string | null;
  status: ApiContentStatus;
  featured: boolean;
  itinerary: ItineraryDayInput[];
  departures: DepartureInput[];
};

export type RideInput = {
  title: string;
  slug?: string;
  type: ApiRideType;
  location: string;
  meetingPoint: string;
  startsAt: string;
  durationLabel: string | null;
  routeStart: string | null;
  routeFinish: string | null;
  waypoints: string[];
  routeSummary: string | null;
  distanceKm: number | null;
  difficulty: ApiDifficulty;
  rideLeader: string | null;
  capacity: number;
  /** Paise per rider; null for a free ride. */
  price: number | null;
  status: ApiRideStatus;
  featured: boolean;
  shortDescription: string | null;
  description: string | null;
  destinationId: string | null;
  tripId: string | null;
};

type ListQuery<S> = { status?: S | undefined; q?: string | undefined };

export const listAdminDestinations = (query: ListQuery<ApiContentStatus> = {}) =>
  api().request<ApiAdminDestination[]>("/admin/destinations", {
    query: { status: query.status, q: query.q || undefined },
  });
export const getAdminDestination = (id: string) =>
  api().request<ApiAdminDestination>(`/admin/destinations/${id}`);
export const createDestination = (input: DestinationInput) =>
  api().request<ApiAdminDestination>("/admin/destinations", { method: "POST", body: input });
export const updateDestination = (id: string, input: Partial<DestinationInput>) =>
  api().request<ApiAdminDestination>(`/admin/destinations/${id}`, { method: "PATCH", body: input });

export const listAdminTrips = (query: ListQuery<ApiContentStatus> = {}) =>
  api().request<ApiAdminTrip[]>("/admin/trips", {
    query: { status: query.status, q: query.q || undefined },
  });
export const getAdminTrip = (id: string) => api().request<ApiAdminTrip>(`/admin/trips/${id}`);
export const createTrip = (input: TripInput) =>
  api().request<ApiAdminTrip>("/admin/trips", { method: "POST", body: input });
export const updateTrip = (id: string, input: Partial<TripInput>) =>
  api().request<ApiAdminTrip>(`/admin/trips/${id}`, { method: "PATCH", body: input });

export const listAdminRides = (query: ListQuery<ApiRideStatus> = {}) =>
  api().request<ApiAdminRide[]>("/admin/rides", {
    query: { status: query.status, q: query.q || undefined },
  });
export const getAdminRide = (id: string) => api().request<ApiAdminRide>(`/admin/rides/${id}`);
export const listRideBookings = (rideId: string) =>
  api().request<ApiAdminRideBooking[]>(`/admin/rides/${rideId}/bookings`);
export const createRide = (input: RideInput) =>
  api().request<ApiAdminRide>("/admin/rides", { method: "POST", body: input });
export const updateRide = (id: string, input: Partial<RideInput>) =>
  api().request<ApiAdminRide>(`/admin/rides/${id}`, { method: "PATCH", body: input });
