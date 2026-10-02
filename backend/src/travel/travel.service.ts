import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { invalidReference, resolveSlug, slugTaken } from "../catalog/unique-slug.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ContentStatus } from "../generated/prisma/enums.js";
import type {
  AdminTravelListQueryDto,
  CreateDestinationDto,
  CreateTripDto,
  DepartureInputDto,
  ItineraryDayInputDto,
  TravelListQueryDto,
  UpdateDestinationDto,
  UpdateTripDto,
} from "./dto/travel-input.dto.js";
import type {
  AdminDestinationDto,
  AdminTripDto,
  DestinationDetailDto,
  DestinationSummaryDto,
  TripDetailDto,
  TripSummaryDto,
} from "./dto/travel-response.dto.js";
import {
  TravelMapper,
  destinationDetailInclude,
  destinationSummaryInclude,
  fromDateString,
  tripDetailInclude,
  tripSummaryInclude,
} from "./travel.mapper.js";

const PUBLISHED = ContentStatus.PUBLISHED;

/**
 * Destinations and trips. Public reads return PUBLISHED records only (a trip also
 * needs a published destination). Admins create, edit, publish and archive;
 * nothing is hard-deleted. Trip saves write the trip, its itinerary and its
 * departures in one transaction.
 */
@Injectable()
export class TravelService {
  private readonly logger = new Logger(TravelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: TravelMapper,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  async listDestinations(query: TravelListQueryDto): Promise<DestinationSummaryDto[]> {
    const rows = await this.prisma.destination.findMany({
      where: {
        status: PUBLISHED,
        ...(query.featured !== undefined ? { featured: query.featured } : {}),
      },
      include: destinationSummaryInclude(),
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });
    return rows.map((row) => this.mapper.destination(row));
  }

  async getDestination(slug: string): Promise<DestinationDetailDto> {
    const row = await this.prisma.destination.findFirst({
      where: { slug, status: PUBLISHED },
      include: destinationDetailInclude(),
    });
    if (!row) throw notFound("Destination");
    return this.mapper.destinationDetail(row);
  }

  /** Published trips, those with the soonest upcoming departure first. */
  async listTrips(query: TravelListQueryDto): Promise<TripSummaryDto[]> {
    const rows = await this.prisma.trip.findMany({
      where: {
        status: PUBLISHED,
        destination: {
          status: PUBLISHED,
          ...(query.destination ? { slug: query.destination } : {}),
        },
        ...(query.featured !== undefined ? { featured: query.featured } : {}),
      },
      include: tripSummaryInclude({ publicOnly: true }),
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });
    const next = (row: (typeof rows)[number]) =>
      row.departures[0]?.startDate.getTime() ?? Number.MAX_SAFE_INTEGER;
    return rows.sort((a, b) => next(a) - next(b)).map((row) => this.mapper.trip(row));
  }

  async getTrip(slug: string): Promise<TripDetailDto> {
    const row = await this.prisma.trip.findFirst({
      where: { slug, status: PUBLISHED, destination: { status: PUBLISHED } },
      include: tripDetailInclude({ publicOnly: true }),
    });
    if (!row) throw notFound("Trip");
    return this.mapper.tripDetail(row);
  }

  // ─── Admin: destinations ────────────────────────────────────────────────

  async adminListDestinations(query: AdminTravelListQueryDto): Promise<AdminDestinationDto[]> {
    const rows = await this.prisma.destination.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
      },
      include: destinationDetailInclude(),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    return rows.map((row) => this.mapper.adminDestination(row));
  }

  async adminGetDestination(id: string): Promise<AdminDestinationDto> {
    const row = await this.prisma.destination.findUnique({
      where: { id },
      include: destinationDetailInclude(),
    });
    if (!row) throw notFound("Destination");
    return this.mapper.adminDestination(row);
  }

  async createDestination(
    admin: AuthUser,
    dto: CreateDestinationDto,
  ): Promise<AdminDestinationDto> {
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "destination",
      isTaken: async (candidate) =>
        (await this.prisma.destination.count({ where: { slug: candidate } })) > 0,
    });
    const status = dto.status ?? ContentStatus.DRAFT;
    const row = await this.prisma.destination.create({
      data: {
        slug,
        name: dto.name,
        region: dto.region,
        country: dto.country ?? "India",
        difficulty: dto.difficulty,
        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        bestSeason: dto.bestSeason ?? null,
        durationRecommendation: dto.durationRecommendation ?? null,
        usefulInfo: dto.usefulInfo ?? null,
        status,
        featured: dto.featured ?? false,
        publishedAt: status === PUBLISHED ? new Date() : null,
      },
      select: { id: true },
    });
    this.logger.log({ adminId: admin.id, destinationId: row.id, status }, "Destination created");
    return this.adminGetDestination(row.id);
  }

  async updateDestination(
    admin: AuthUser,
    id: string,
    dto: UpdateDestinationDto,
  ): Promise<AdminDestinationDto> {
    const existing = await this.prisma.destination.findUnique({
      where: { id },
      select: { slug: true, publishedAt: true },
    });
    if (!existing) throw notFound("Destination");
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      (await this.prisma.destination.count({ where: { slug: dto.slug } }))
    ) {
      throw slugTaken("destination");
    }
    await this.prisma.destination.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.region ? { region: dto.region } : {}),
        ...(dto.country ? { country: dto.country } : {}),
        ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
        ...nullable(dto, [
          "shortDescription",
          "description",
          "bestSeason",
          "durationRecommendation",
          "usefulInfo",
        ]),
        ...(dto.status ? { status: dto.status } : {}),
        ...(isSet(dto.featured) ? { featured: dto.featured } : {}),
        ...(dto.status === PUBLISHED && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
    this.logger.log(
      { adminId: admin.id, destinationId: id, fields: Object.keys(dto) },
      "Destination updated",
    );
    return this.adminGetDestination(id);
  }

  async archiveDestination(admin: AuthUser, id: string): Promise<AdminDestinationDto> {
    return this.updateDestination(admin, id, { status: ContentStatus.ARCHIVED });
  }

  // ─── Admin: trips ────────────────────────────────────────────────────────

  async adminListTrips(query: AdminTravelListQueryDto): Promise<AdminTripDto[]> {
    const rows = await this.prisma.trip.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.destinationId ? { destinationId: query.destinationId } : {}),
        ...(query.q ? { name: { contains: query.q, mode: "insensitive" } } : {}),
      },
      include: tripDetailInclude({ publicOnly: false }),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    return rows.map((row) => this.mapper.adminTrip(row));
  }

  async adminGetTrip(id: string): Promise<AdminTripDto> {
    const row = await this.prisma.trip.findUnique({
      where: { id },
      include: tripDetailInclude({ publicOnly: false }),
    });
    if (!row) throw notFound("Trip");
    return this.mapper.adminTrip(row);
  }

  async createTrip(admin: AuthUser, dto: CreateTripDto): Promise<AdminTripDto> {
    await this.assertDestination(dto.destinationId);
    assertDepartures(dto.departures ?? []);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "trip",
      isTaken: async (candidate) =>
        (await this.prisma.trip.count({ where: { slug: candidate } })) > 0,
    });
    const status = dto.status ?? ContentStatus.DRAFT;
    const id = await this.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          slug,
          name: dto.name,
          destinationId: dto.destinationId,
          durationDays: dto.durationDays,
          distanceKm: dto.distanceKm ?? null,
          difficulty: dto.difficulty,
          startingLocation: dto.startingLocation,
          endingLocation: dto.endingLocation ?? null,
          shortDescription: dto.shortDescription ?? null,
          description: dto.description ?? null,
          status,
          featured: dto.featured ?? false,
          publishedAt: status === PUBLISHED ? new Date() : null,
        },
        select: { id: true },
      });
      await replaceItinerary(tx, trip.id, dto.itinerary ?? []);
      await syncDepartures(tx, trip.id, dto.departures ?? []);
      return trip.id;
    });
    this.logger.log({ adminId: admin.id, tripId: id, status }, "Trip created");
    return this.adminGetTrip(id);
  }

  async updateTrip(admin: AuthUser, id: string, dto: UpdateTripDto): Promise<AdminTripDto> {
    const existing = await this.prisma.trip.findUnique({
      where: { id },
      select: { slug: true, publishedAt: true },
    });
    if (!existing) throw notFound("Trip");
    if (dto.destinationId) await this.assertDestination(dto.destinationId);
    if (dto.departures) assertDepartures(dto.departures);
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      (await this.prisma.trip.count({ where: { slug: dto.slug } }))
    ) {
      throw slugTaken("trip");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.slug ? { slug: dto.slug } : {}),
          ...(dto.destinationId ? { destinationId: dto.destinationId } : {}),
          ...(isSet(dto.durationDays) ? { durationDays: dto.durationDays } : {}),
          ...(dto.distanceKm !== undefined ? { distanceKm: dto.distanceKm } : {}),
          ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
          ...(dto.startingLocation ? { startingLocation: dto.startingLocation } : {}),
          ...nullable(dto, ["endingLocation", "shortDescription", "description"]),
          ...(dto.status ? { status: dto.status } : {}),
          ...(isSet(dto.featured) ? { featured: dto.featured } : {}),
          ...(dto.status === PUBLISHED && !existing.publishedAt ? { publishedAt: new Date() } : {}),
        },
      });
      if (dto.itinerary) await replaceItinerary(tx, id, dto.itinerary);
      if (dto.departures) await syncDepartures(tx, id, dto.departures);
    });
    this.logger.log({ adminId: admin.id, tripId: id, fields: Object.keys(dto) }, "Trip updated");
    return this.adminGetTrip(id);
  }

  async archiveTrip(admin: AuthUser, id: string): Promise<AdminTripDto> {
    return this.updateTrip(admin, id, { status: ContentStatus.ARCHIVED });
  }

  private async assertDestination(id: string): Promise<void> {
    if (!(await this.prisma.destination.count({ where: { id } }))) {
      throw invalidReference("destinationId", "The selected destination does not exist.");
    }
  }
}

async function replaceItinerary(
  tx: Prisma.TransactionClient,
  tripId: string,
  days: ItineraryDayInputDto[],
) {
  await tx.tripItineraryDay.deleteMany({ where: { tripId } });
  if (days.length === 0) return;
  await tx.tripItineraryDay.createMany({
    data: days.map((day, index) => ({
      tripId,
      dayNumber: index + 1,
      title: day.title,
      description: day.description ?? null,
      routeSummary: day.routeSummary ?? null,
      distanceKm: day.distanceKm ?? null,
      accommodation: day.accommodation ?? null,
      notes: day.notes ?? null,
    })),
  });
}

/**
 * Departures keep their ids across edits (future bookings will point at them):
 * rows with a known id are updated, new rows are created, missing rows removed.
 */
async function syncDepartures(
  tx: Prisma.TransactionClient,
  tripId: string,
  rows: DepartureInputDto[],
) {
  const existing = new Set(
    (await tx.tripDeparture.findMany({ where: { tripId }, select: { id: true } })).map(
      (row) => row.id,
    ),
  );
  const keep = rows.flatMap((row) => (row.id && existing.has(row.id) ? [row.id] : []));
  await tx.tripDeparture.deleteMany({ where: { tripId, id: { notIn: keep } } });
  for (const row of rows) {
    const data = {
      startDate: fromDateString(row.startDate),
      endDate: fromDateString(row.endDate),
      price: row.price ?? null,
      capacity: row.capacity,
      ...(row.status ? { status: row.status } : {}),
    };
    if (row.id && existing.has(row.id))
      await tx.tripDeparture.update({ where: { id: row.id }, data });
    else await tx.tripDeparture.create({ data: { ...data, tripId } });
  }
}

function assertDepartures(rows: DepartureInputDto[]): void {
  rows.forEach((row, index) => {
    if (row.endDate < row.startDate) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        "Request validation failed.",
        [
          {
            field: `departures.${index}.endDate`,
            messages: ["endDate must be on or after startDate"],
          },
        ],
      );
    }
  });
}

/** Copies the listed nullable fields that were sent (null clears them). */
function nullable<T extends object, K extends keyof T>(dto: T, keys: K[]): Partial<Pick<T, K>> {
  return Object.fromEntries(
    keys.filter((key) => dto[key] !== undefined).map((key) => [key, dto[key]]),
  ) as Partial<Pick<T, K>>;
}

function isSet<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
