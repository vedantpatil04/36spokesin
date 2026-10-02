/** API → UI mapping for travel and rides. Money arrives in paise; images may be absent. */

import { media } from "@/data/media";
import type {
  ApiDepartureStatus,
  ApiDestinationDetail,
  ApiDestinationSummary,
  ApiDifficulty,
  ApiProductImage,
  ApiRideDetail,
  ApiRideRef,
  ApiRideStatus,
  ApiRideSummary,
  ApiRideType,
  ApiTripDetail,
  ApiTripSummary,
} from "@/lib/api";
import { minorToRupees } from "@/lib/money";
import type {
  DepartureStatus,
  Destination,
  DestinationDetail,
  Difficulty,
  MediaAsset,
  MediaCategory,
  ProductImage,
  Ride,
  RideDetail,
  RideRef,
  RideStatus,
  RideType,
  RideTypeSlug,
  Trip,
  TripDetail,
} from "@/types";
import { toMediaAsset } from "./catalog-mappers";

export const DIFFICULTY: Record<ApiDifficulty, Difficulty> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
  EXPERT: "Expert",
};

export const RIDE_TYPES: { slug: RideTypeSlug; label: RideType; api: ApiRideType }[] = [
  { slug: "day-ride", label: "Day Ride", api: "DAY_RIDE" },
  { slug: "weekend", label: "Weekend", api: "WEEKEND" },
  { slug: "group-ride", label: "Group Ride", api: "GROUP_RIDE" },
  { slug: "event", label: "Event", api: "EVENT" },
];

const RIDE_STATUS: Partial<Record<ApiRideStatus, RideStatus>> = {
  UPCOMING: "upcoming",
  FULL: "full",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const DEPARTURE_STATUS: Record<ApiDepartureStatus, DepartureStatus> = {
  OPEN: "open",
  FULL: "full",
  CLOSED: "closed",
  CANCELLED: "closed",
};

function cover(image: ApiProductImage | null, category: MediaCategory, name: string) {
  const asset = toMediaAsset(image, category, name);
  return {
    image:
      asset ?? ({ ...media.placeholders.bike, alt: `${name}, no photo yet` } satisfies MediaAsset),
    hasImage: asset !== null,
  };
}

function gallery(images: ApiProductImage[], category: MediaCategory, name: string): ProductImage[] {
  return images.flatMap((image) => {
    const asset = toMediaAsset(image, category, name);
    return asset
      ? [{ id: image.id, asset, caption: image.caption, isPrimary: image.isPrimary }]
      : [];
  });
}

const rideRef = (ride: ApiRideRef): RideRef => ({
  slug: ride.slug,
  name: ride.title,
  startsAt: ride.startsAt,
});

export function toDestination(api: ApiDestinationSummary): Destination {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    region: api.region,
    country: api.country,
    descriptor: api.shortDescription ?? "",
    duration: api.durationRecommendation,
    bestSeason: api.bestSeason,
    difficulty: DIFFICULTY[api.difficulty],
    startingPrice: api.startingPrice !== null ? minorToRupees(api.startingPrice) : null,
    tripCount: api.tripCount,
    featured: api.featured,
    ...cover(api.primaryImage, "destinations", api.name),
  };
}

export function toDestinationDetail(api: ApiDestinationDetail): DestinationDetail {
  return {
    ...toDestination(api),
    description: api.description,
    usefulInfo: api.usefulInfo,
    images: gallery(api.images, "destinations", api.name),
    rides: api.rides.map(rideRef),
  };
}

export function toTrip(api: ApiTripSummary): Trip {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    summary: api.shortDescription ?? "",
    destinationSlug: api.destination.slug,
    destinationName: api.destination.name,
    days: api.durationDays,
    distanceKm: api.distanceKm,
    difficulty: DIFFICULTY[api.difficulty],
    startLocation: api.startingLocation,
    endLocation: api.endingLocation,
    ...cover(api.primaryImage, "trips", api.name),
    departures: api.departures.map((departure) => ({
      id: departure.id,
      tripId: api.id,
      startDate: departure.startDate,
      endDate: departure.endDate,
      price: departure.price !== null ? minorToRupees(departure.price) : null,
      seatsTotal: departure.capacity,
      status: DEPARTURE_STATUS[departure.status],
    })),
  };
}

export function toTripDetail(api: ApiTripDetail): TripDetail {
  return {
    ...toTrip(api),
    description: api.description,
    itinerary: api.itinerary.map((day) => ({ ...day })),
    images: gallery(api.images, "trips", api.name),
    rides: api.rides.map(rideRef),
  };
}

export function toRide(api: ApiRideSummary): Ride {
  return {
    id: api.id,
    slug: api.slug,
    name: api.title,
    type: RIDE_TYPES.find((type) => type.api === api.type)?.label ?? "Day Ride",
    location: api.location,
    summary: api.shortDescription ?? "",
    meetingPoint: api.meetingPoint,
    startsAt: api.startsAt,
    route: {
      start: api.routeStart,
      finish: api.routeFinish,
      waypoints: api.waypoints,
      distanceKm: api.distanceKm,
    },
    routeSummary: api.routeSummary,
    duration: api.durationLabel,
    difficulty: DIFFICULTY[api.difficulty],
    rideLeader: api.rideLeader,
    status: RIDE_STATUS[api.status] ?? "upcoming",
    featured: api.featured,
    capacity: api.capacity,
    price: api.price !== null ? minorToRupees(api.price) : null,
    registeredCount: api.registeredCount,
    spotsLeft: api.spotsLeft,
    registrationOpen: api.registrationOpen,
    ...cover(api.primaryImage, "rides", api.title),
    destination: api.destination
      ? { slug: api.destination.slug, name: api.destination.name }
      : null,
    trip: api.trip ? { slug: api.trip.slug, name: api.trip.name } : null,
  };
}

export function toRideDetail(api: ApiRideDetail): RideDetail {
  return {
    ...toRide(api),
    description: api.description,
    images: gallery(api.images, "rides", api.title),
  };
}
