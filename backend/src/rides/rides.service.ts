import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { invalidReference, resolveSlug, slugTaken } from "../catalog/unique-slug.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { PaymentStatus, RideRegistrationStatus, RideStatus } from "../generated/prisma/enums.js";
import { galleryInclude } from "../galleries/gallery-owners.js";
import { GalleryService } from "../galleries/gallery.service.js";
import { bookingReference } from "./booking-reference.js";
import {
  currentPayment,
  latestPaymentInclude,
  registrationResponse,
  ridePaymentStatus,
} from "./ride-booking.mapper.js";
import {
  holdDeadline,
  holdsSeat,
  releaseLapsedHolds,
  requiresPayment,
  seatHoldingWhere,
} from "./seat-hold.js";
import type {
  AdminRideBookingDto,
  AdminRideDto,
  AdminRideListQueryDto,
  BookRideDto,
  CreateRideDto,
  MyRideDto,
  RideDetailDto,
  RideListQueryDto,
  RideRegistrationDto,
  RideSummaryDto,
  UpdateRideDto,
} from "./dto/ride.dto.js";

/** Statuses the public site may show. DRAFT and ARCHIVED never leave the CMS. */
export const PUBLIC_RIDE_STATUSES: RideStatus[] = [
  RideStatus.UPCOMING,
  RideStatus.FULL,
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
];

/** Ride prices are stored in paise; INR is the only currency rides are sold in. */
const RIDE_CURRENCY = "INR";

/**
 * Seats taken on a ride, always counted from the booking rows (see seat-hold.ts):
 * confirmed bookings and unpaid ones whose hold is still running. Cancelled
 * bookings and lapsed holds are kept as history and take no seat.
 */
const seatsTaken = (now: Date) =>
  ({ _count: { select: { registrations: { where: seatHoldingWhere(now) } } } }) as const;

const rideSummaryInclude = (now: Date) =>
  ({
    ...seatsTaken(now),
    images: { where: { isPrimary: true }, take: 1, include: { mediaAsset: true } },
    destination: { select: { id: true, slug: true, name: true } },
    trip: { select: { id: true, slug: true, name: true } },
  }) satisfies Prisma.RideInclude;

const rideDetailInclude = (now: Date) =>
  ({
    ...rideSummaryInclude(now),
    images: galleryInclude,
  }) satisfies Prisma.RideInclude;

type RideRow = Prisma.RideGetPayload<{ include: ReturnType<typeof rideSummaryInclude> }>;
type RideDetailRow = Prisma.RideGetPayload<{ include: ReturnType<typeof rideDetailInclude> }>;

/**
 * Rides and ride registrations. Joining and leaving lock the ride row, so the
 * capacity check and the write are atomic: two riders can never take the last
 * spot. Every rule is enforced here, not in the UI.
 */
@Injectable()
export class RidesService {
  private readonly logger = new Logger(RidesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly galleries: GalleryService,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  async list(query: RideListQueryDto): Promise<RideSummaryDto[]> {
    const now = new Date();
    const past = query.when === "past";
    const rows = await this.prisma.ride.findMany({
      where: {
        ...(past
          ? {
              status: { in: PUBLIC_RIDE_STATUSES },
              OR: [{ startsAt: { lt: now } }, { status: RideStatus.COMPLETED }],
            }
          : {
              status: { in: [RideStatus.UPCOMING, RideStatus.FULL, RideStatus.CANCELLED] },
              startsAt: { gte: now },
            }),
        ...(query.type ? { type: query.type } : {}),
        ...(query.destination ? { destination: { slug: query.destination } } : {}),
      },
      include: rideSummaryInclude(now),
      orderBy: past ? [{ startsAt: "desc" }] : [{ startsAt: "asc" }],
      take: 100,
    });
    return rows.map((row) => this.summary(row, now));
  }

  async getBySlug(slug: string): Promise<RideDetailDto> {
    const row = await this.prisma.ride.findFirst({
      where: { slug, status: { in: PUBLIC_RIDE_STATUSES } },
      include: rideDetailInclude(new Date()),
    });
    if (!row) throw notFound("Ride");
    return this.detail(row);
  }

  // ─── Registration ────────────────────────────────────────────────────────

  async registration(user: AuthUser, rideId: string): Promise<RideRegistrationDto> {
    await this.findPublic(this.prisma, rideId);
    await releaseLapsedHolds(this.prisma, { rideId, userId: user.id }, new Date());
    const row = await this.prisma.rideRegistration.findUnique({
      where: { rideId_userId: { rideId, userId: user.id } },
      include: latestPaymentInclude,
    });
    return registrationResponse(rideId, row);
  }

  /**
   * Books the rider onto the ride. The contact phone, motorcycle and note are
   * stored with the price quoted at that moment; booking again after a
   * cancellation reuses the row and replaces them.
   *
   * A free ride is confirmed at once. A paid ride is held as PENDING_PAYMENT:
   * the seat is reserved for PAYMENT_HOLD_MINUTES while the rider pays and
   * uploads the proof (see PaymentsService), and only an admin's approval
   * confirms it.
   */
  async join(user: AuthUser, rideId: string, dto: BookRideDto): Promise<RideRegistrationDto> {
    const row = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await lockRow(tx, "rides", rideId);
      const ride = await this.findPublic(tx, rideId);
      const closed = closedReason(ride, now);
      if (closed)
        throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.RIDE_CLOSED, closed);

      // Seats whose hold ran out are free again before anyone is counted.
      await releaseLapsedHolds(tx, { rideId }, now);
      const existing = await tx.rideRegistration.findUnique({
        where: { rideId_userId: { rideId, userId: user.id } },
      });
      if (existing && existing.status !== RideRegistrationStatus.CANCELLED) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.ALREADY_REGISTERED,
          existing.status === RideRegistrationStatus.REGISTERED
            ? "You're already on this ride."
            : "You already have a booking on this ride that is waiting for payment.",
        );
      }
      const taken = await tx.rideRegistration.count({
        where: { rideId, ...seatHoldingWhere(now) },
      });
      if (taken >= ride.capacity) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.RIDE_FULL,
          "This ride is full.",
        );
      }
      const paid = requiresPayment(ride.price);
      if (paid && !(await tx.paymentSettings.count({ where: { upiId: { not: null } } }))) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.PAYMENT_NOT_CONFIGURED,
          "This ride isn't taking bookings yet: its payment details haven't been set up.",
        );
      }
      const booking = {
        status: paid ? RideRegistrationStatus.PENDING_PAYMENT : RideRegistrationStatus.REGISTERED,
        holdExpiresAt: paid ? holdDeadline(now) : null,
        bookedAt: now,
        cancelledAt: null,
        contactPhone: dto.contactPhone,
        bikeLabel: dto.riderBikeId ? await this.ownBikeLabel(tx, user, dto.riderBikeId) : null,
        note: dto.note ?? null,
        amount: ride.price,
        currency: ride.price === null ? null : RIDE_CURRENCY,
      };
      return tx.rideRegistration.upsert({
        where: { rideId_userId: { rideId, userId: user.id } },
        create: { rideId, userId: user.id, ...booking },
        update: booking,
        include: latestPaymentInclude,
      });
    });
    this.logger.log(
      { userId: user.id, rideId, booking: row.number, status: row.status },
      "Rider booked ride",
    );
    return registrationResponse(rideId, row);
  }

  /**
   * Cancels the rider's own booking, confirmed or still waiting for payment,
   * before the ride starts. The row stays as history and its seat is freed; a
   * proof still awaiting review is closed with it.
   */
  async leave(user: AuthUser, rideId: string): Promise<RideRegistrationDto> {
    const row = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await lockRow(tx, "rides", rideId);
      const ride = await this.findPublic(tx, rideId);
      await releaseLapsedHolds(tx, { rideId, userId: user.id }, now);
      const existing = await tx.rideRegistration.findUnique({
        where: { rideId_userId: { rideId, userId: user.id } },
      });
      if (!existing) throw notFound("Booking");
      if (existing.status === RideRegistrationStatus.CANCELLED) {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.CONFLICT,
          "This booking is already cancelled.",
        );
      }
      if (ride.startsAt <= now) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.RIDE_CLOSED,
          "This ride has already started.",
        );
      }
      await tx.payment.updateMany({
        where: { rideRegistrationId: existing.id, status: PaymentStatus.PROOF_SUBMITTED },
        data: { status: PaymentStatus.CANCELLED },
      });
      return tx.rideRegistration.update({
        where: { id: existing.id },
        data: { status: RideRegistrationStatus.CANCELLED, cancelledAt: now, holdExpiresAt: null },
        include: latestPaymentInclude,
      });
    });
    this.logger.log({ userId: user.id, rideId, booking: row.number }, "Rider cancelled booking");
    return registrationResponse(rideId, row);
  }

  /**
   * The rider's bookings on public rides, soonest ride first. Cancelled bookings
   * are included as history and hold no seat.
   */
  async myRides(user: AuthUser): Promise<MyRideDto[]> {
    const now = new Date();
    await releaseLapsedHolds(this.prisma, { userId: user.id }, now);
    const rows = await this.prisma.rideRegistration.findMany({
      where: { userId: user.id, ride: { status: { in: PUBLIC_RIDE_STATUSES } } },
      include: { ride: { include: rideSummaryInclude(now) }, ...latestPaymentInclude },
      orderBy: { ride: { startsAt: "asc" } },
    });
    return rows.map((row) => ({
      ride: this.summary(row.ride, now),
      bookingNumber: row.number,
      reference: bookingReference(row.number),
      status: row.status,
      paymentStatus: ridePaymentStatus(row, currentPayment(row)),
      registeredAt: row.bookedAt,
      cancelledAt: row.cancelledAt,
    }));
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  async adminList(query: AdminRideListQueryDto): Promise<AdminRideDto[]> {
    const rows = await this.prisma.ride.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
      },
      include: rideDetailInclude(new Date()),
      orderBy: [{ startsAt: "desc" }, { id: "desc" }],
    });
    return rows.map((row) => this.admin(row));
  }

  /** Every booking on a ride for the crew: riders holding a seat first, then cancelled. */
  async adminBookings(rideId: string): Promise<AdminRideBookingDto[]> {
    if (!(await this.prisma.ride.count({ where: { id: rideId } }))) throw notFound("Ride");
    const now = new Date();
    await releaseLapsedHolds(this.prisma, { rideId }, now);
    const rows = await this.prisma.rideRegistration.findMany({
      where: { rideId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        ...latestPaymentInclude,
      },
      orderBy: [{ status: "asc" }, { number: "asc" }],
    });
    return rows.map((row) => ({
      id: row.id,
      reference: bookingReference(row.number),
      status: row.status,
      paymentStatus: ridePaymentStatus(row, currentPayment(row)),
      seats: holdsSeat(row, now) ? 1 : 0,
      riderName: [row.user.firstName, row.user.lastName].filter(Boolean).join(" "),
      riderEmail: row.user.email,
      contactPhone: row.contactPhone,
      bikeLabel: row.bikeLabel,
      note: row.note,
      amount: row.amount,
      createdAt: row.bookedAt,
      cancelledAt: row.cancelledAt,
    }));
  }

  async adminGet(id: string): Promise<AdminRideDto> {
    const row = await this.prisma.ride.findUnique({
      where: { id },
      include: rideDetailInclude(new Date()),
    });
    if (!row) throw notFound("Ride");
    return this.admin(row);
  }

  async create(admin: AuthUser, dto: CreateRideDto): Promise<AdminRideDto> {
    await this.assertLinks(dto);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.title,
      entity: "ride",
      isTaken: async (candidate) =>
        (await this.prisma.ride.count({ where: { slug: candidate } })) > 0,
    });
    const status = dto.status ?? RideStatus.DRAFT;
    const row = await this.prisma.ride.create({
      data: {
        slug,
        title: dto.title,
        shortDescription: dto.shortDescription ?? null,
        description: dto.description ?? null,
        type: dto.type,
        location: dto.location,
        meetingPoint: dto.meetingPoint,
        startsAt: new Date(dto.startsAt),
        durationLabel: dto.durationLabel ?? null,
        routeStart: dto.routeStart ?? null,
        routeFinish: dto.routeFinish ?? null,
        waypoints: cleanWaypoints(dto.waypoints ?? []),
        routeSummary: dto.routeSummary ?? null,
        distanceKm: dto.distanceKm ?? null,
        difficulty: dto.difficulty,
        rideLeader: dto.rideLeader ?? null,
        capacity: dto.capacity,
        price: dto.price ?? null,
        status,
        featured: dto.featured ?? false,
        destinationId: dto.destinationId ?? null,
        tripId: dto.tripId ?? null,
        publishedAt: PUBLIC_RIDE_STATUSES.includes(status) ? new Date() : null,
      },
      select: { id: true },
    });
    this.logger.log({ adminId: admin.id, rideId: row.id, status }, "Ride created");
    return this.adminGet(row.id);
  }

  async update(admin: AuthUser, id: string, dto: UpdateRideDto): Promise<AdminRideDto> {
    const existing = await this.prisma.ride.findUnique({
      where: { id },
      select: { slug: true, publishedAt: true, ...seatsTaken(new Date()) },
    });
    if (!existing) throw notFound("Ride");
    await this.assertLinks(dto);
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      (await this.prisma.ride.count({ where: { slug: dto.slug } }))
    ) {
      throw slugTaken("ride");
    }
    if (isSet(dto.capacity) && dto.capacity < existing._count.registrations) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.UNPROCESSABLE_ENTITY,
        `${existing._count.registrations} seats are booked or held; capacity can't be lower than that.`,
        [{ field: "capacity", messages: ["capacity is below the number of seats taken"] }],
      );
    }
    const publishing =
      dto.status && PUBLIC_RIDE_STATUSES.includes(dto.status) && !existing.publishedAt;
    const data: Prisma.RideUncheckedUpdateInput = {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.slug ? { slug: dto.slug } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.location ? { location: dto.location } : {}),
      ...(dto.meetingPoint ? { meetingPoint: dto.meetingPoint } : {}),
      ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.difficulty ? { difficulty: dto.difficulty } : {}),
      ...(isSet(dto.capacity) ? { capacity: dto.capacity } : {}),
      ...(dto.status ? { status: dto.status } : {}),
      ...(isSet(dto.featured) ? { featured: dto.featured } : {}),
      ...(dto.waypoints ? { waypoints: cleanWaypoints(dto.waypoints) } : {}),
      ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.durationLabel !== undefined ? { durationLabel: dto.durationLabel } : {}),
      ...(dto.routeStart !== undefined ? { routeStart: dto.routeStart } : {}),
      ...(dto.routeFinish !== undefined ? { routeFinish: dto.routeFinish } : {}),
      ...(dto.routeSummary !== undefined ? { routeSummary: dto.routeSummary } : {}),
      ...(dto.distanceKm !== undefined ? { distanceKm: dto.distanceKm } : {}),
      ...(dto.rideLeader !== undefined ? { rideLeader: dto.rideLeader } : {}),
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      ...(dto.destinationId !== undefined ? { destinationId: dto.destinationId } : {}),
      ...(dto.tripId !== undefined ? { tripId: dto.tripId } : {}),
      ...(publishing ? { publishedAt: new Date() } : {}),
    };
    await this.prisma.ride.update({ where: { id }, data });
    this.logger.log({ adminId: admin.id, rideId: id, fields: Object.keys(dto) }, "Ride updated");
    return this.adminGet(id);
  }

  async archive(admin: AuthUser, id: string): Promise<AdminRideDto> {
    return this.update(admin, id, { status: RideStatus.ARCHIVED });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async findPublic(client: Prisma.TransactionClient, rideId: string) {
    const ride = await client.ride.findFirst({
      where: { id: rideId, status: { in: PUBLIC_RIDE_STATUSES } },
      select: { id: true, status: true, startsAt: true, capacity: true, price: true },
    });
    if (!ride) throw notFound("Ride");
    return ride;
  }

  /** "Royal Enfield Himalayan 450 Hanle Black (2024)" for one of the rider's own bikes. */
  private async ownBikeLabel(
    client: Prisma.TransactionClient,
    user: AuthUser,
    riderBikeId: string,
  ): Promise<string> {
    const bike = await client.riderBike.findFirst({
      where: { id: riderBikeId, userId: user.id },
      select: {
        year: true,
        bikeVariant: { select: { name: true } },
        bikeModel: { select: { name: true, brand: { select: { name: true } } } },
      },
    });
    if (!bike) throw invalidReference("riderBikeId", "Choose a motorcycle from your garage.");
    const name = [bike.bikeModel.brand.name, bike.bikeModel.name, bike.bikeVariant?.name]
      .filter(Boolean)
      .join(" ");
    return bike.year ? `${name} (${bike.year})` : name;
  }

  private async assertLinks(dto: UpdateRideDto): Promise<void> {
    if (
      dto.destinationId &&
      !(await this.prisma.destination.count({ where: { id: dto.destinationId } }))
    ) {
      throw invalidReference("destinationId", "The selected destination does not exist.");
    }
    if (dto.tripId && !(await this.prisma.trip.count({ where: { id: dto.tripId } }))) {
      throw invalidReference("tripId", "The selected trip does not exist.");
    }
  }

  private summary(row: RideRow | RideDetailRow, now: Date): RideSummaryDto {
    const registered = row._count.registrations;
    const spotsLeft = Math.max(0, row.capacity - registered);
    const primary = row.images.find((image) => image.isPrimary) ?? null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortDescription: row.shortDescription,
      type: row.type,
      location: row.location,
      meetingPoint: row.meetingPoint,
      startsAt: row.startsAt,
      durationLabel: row.durationLabel,
      routeStart: row.routeStart,
      routeFinish: row.routeFinish,
      waypoints: row.waypoints,
      routeSummary: row.routeSummary,
      distanceKm: row.distanceKm,
      difficulty: row.difficulty,
      rideLeader: row.rideLeader,
      capacity: row.capacity,
      price: row.price,
      registeredCount: registered,
      spotsLeft,
      registrationOpen: closedReason(row, now) === null && spotsLeft > 0,
      status: row.status,
      featured: row.featured,
      primaryImage: primary ? this.galleries.image(primary) : null,
      destination: row.destination,
      trip: row.trip,
    };
  }

  private detail(row: RideDetailRow): RideDetailDto {
    return {
      ...this.summary(row, new Date()),
      description: row.description,
      images: row.images.map((image) => this.galleries.image(image)),
    };
  }

  private admin(row: RideDetailRow): AdminRideDto {
    return { ...this.detail(row), publishedAt: row.publishedAt, updatedAt: row.updatedAt };
  }
}

/** Why a ride isn't taking riders, or null when it is (capacity is checked separately). */
function closedReason(ride: { status: RideStatus; startsAt: Date }, now: Date): string | null {
  switch (ride.status) {
    case RideStatus.CANCELLED:
      return "This ride has been cancelled.";
    case RideStatus.FULL:
      return "This ride is full.";
    case RideStatus.COMPLETED:
      return "This ride has already happened.";
    case RideStatus.UPCOMING:
      return ride.startsAt <= now ? "This ride has already started." : null;
    default:
      return "This ride isn't open for registration.";
  }
}

function cleanWaypoints(waypoints: string[]): string[] {
  return waypoints.map((waypoint) => waypoint.trim()).filter(Boolean);
}

function isSet<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}
