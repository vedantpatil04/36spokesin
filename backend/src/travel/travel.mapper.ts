import { Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";
import { ContentStatus, DepartureStatus, RideStatus } from "../generated/prisma/enums.js";
import { galleryInclude } from "../galleries/gallery-owners.js";
import { GalleryService } from "../galleries/gallery.service.js";
import type {
  AdminDestinationDto,
  AdminTripDto,
  DestinationDetailDto,
  DestinationSummaryDto,
  RideRefDto,
  TripDepartureDto,
  TripDetailDto,
  TripSummaryDto,
} from "./dto/travel-response.dto.js";

/** Rides shown on destination and trip pages: public and not yet started. */
export const linkedRidesInclude = () =>
  ({
    where: {
      status: { in: [RideStatus.UPCOMING, RideStatus.FULL] },
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    take: 6,
    select: { id: true, slug: true, title: true, startsAt: true },
  }) satisfies Prisma.Destination$ridesArgs;

const primaryImage = {
  where: { isPrimary: true },
  take: 1,
  include: { mediaAsset: true },
} as const;

/** Open departures that haven't started, for public pages and "from ₹" prices. */
export const upcomingDeparturesWhere = (): Prisma.TripDepartureWhereInput => ({
  status: { not: DepartureStatus.CANCELLED },
  startDate: { gte: startOfTodayUtc() },
});

export const destinationSummaryInclude = () =>
  ({
    images: primaryImage,
    trips: {
      where: { status: ContentStatus.PUBLISHED },
      select: {
        departures: {
          where: {
            ...upcomingDeparturesWhere(),
            status: DepartureStatus.OPEN,
            price: { not: null },
          },
          select: { price: true },
        },
      },
    },
  }) satisfies Prisma.DestinationInclude;

export const destinationDetailInclude = () =>
  ({
    ...destinationSummaryInclude(),
    images: galleryInclude,
    rides: linkedRidesInclude(),
  }) satisfies Prisma.DestinationInclude;

export const tripSummaryInclude = (options: { publicOnly: boolean }) =>
  ({
    destination: { select: { id: true, slug: true, name: true } },
    images: primaryImage,
    departures: {
      ...(options.publicOnly ? { where: upcomingDeparturesWhere() } : {}),
      orderBy: { startDate: "asc" },
    },
  }) satisfies Prisma.TripInclude;

export const tripDetailInclude = (options: { publicOnly: boolean }) =>
  ({
    ...tripSummaryInclude(options),
    images: galleryInclude,
    itinerary: { orderBy: { dayNumber: "asc" } },
    rides: linkedRidesInclude(),
  }) satisfies Prisma.TripInclude;

type DestinationSummaryRow = Prisma.DestinationGetPayload<{
  include: ReturnType<typeof destinationSummaryInclude>;
}>;
type DestinationDetailRow = Prisma.DestinationGetPayload<{
  include: ReturnType<typeof destinationDetailInclude>;
}>;
type TripSummaryRow = Prisma.TripGetPayload<{ include: ReturnType<typeof tripSummaryInclude> }>;
type TripDetailRow = Prisma.TripGetPayload<{ include: ReturnType<typeof tripDetailInclude> }>;

@Injectable()
export class TravelMapper {
  constructor(private readonly galleries: GalleryService) {}

  destination(row: DestinationSummaryRow): DestinationSummaryDto {
    const prices = row.trips.flatMap((trip) =>
      trip.departures.flatMap((departure) => (departure.price === null ? [] : [departure.price])),
    );
    const primary = row.images.find((image) => image.isPrimary) ?? null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      region: row.region,
      country: row.country,
      difficulty: row.difficulty,
      bestSeason: row.bestSeason,
      durationRecommendation: row.durationRecommendation,
      featured: row.featured,
      primaryImage: primary ? this.galleries.image(primary) : null,
      startingPrice: prices.length > 0 ? Math.min(...prices) : null,
      tripCount: row.trips.length,
    };
  }

  destinationDetail(row: DestinationDetailRow): DestinationDetailDto {
    return {
      ...this.destination(row),
      description: row.description,
      usefulInfo: row.usefulInfo,
      images: row.images.map((image) => this.galleries.image(image)),
      rides: row.rides.map(rideRef),
    };
  }

  adminDestination(row: DestinationDetailRow): AdminDestinationDto {
    return {
      ...this.destinationDetail(row),
      status: row.status,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    };
  }

  trip(row: TripSummaryRow): TripSummaryDto {
    const primary = row.images.find((image) => image.isPrimary) ?? null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDescription: row.shortDescription,
      destination: row.destination,
      durationDays: row.durationDays,
      distanceKm: row.distanceKm,
      difficulty: row.difficulty,
      startingLocation: row.startingLocation,
      endingLocation: row.endingLocation,
      featured: row.featured,
      primaryImage: primary ? this.galleries.image(primary) : null,
      departures: row.departures.map(departure),
    };
  }

  tripDetail(row: TripDetailRow): TripDetailDto {
    return {
      ...this.trip(row),
      description: row.description,
      itinerary: row.itinerary.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        routeSummary: day.routeSummary,
        distanceKm: day.distanceKm,
        accommodation: day.accommodation,
        notes: day.notes,
      })),
      images: row.images.map((image) => this.galleries.image(image)),
      rides: row.rides.map(rideRef),
    };
  }

  adminTrip(row: TripDetailRow): AdminTripDto {
    return {
      ...this.tripDetail(row),
      status: row.status,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    };
  }
}

function rideRef(ride: { id: string; slug: string; title: string; startsAt: Date }): RideRefDto {
  return { id: ride.id, slug: ride.slug, title: ride.title, startsAt: ride.startsAt };
}

function departure(row: Prisma.TripDepartureGetPayload<object>): TripDepartureDto {
  return {
    id: row.id,
    startDate: toDateString(row.startDate),
    endDate: toDateString(row.endDate),
    price: row.price,
    capacity: row.capacity,
    status: row.status,
  };
}

/** `@db.Date` columns come back as UTC midnight. */
export const toDateString = (date: Date) => date.toISOString().slice(0, 10);
export const fromDateString = (value: string) => new Date(`${value}T00:00:00.000Z`);

export function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
