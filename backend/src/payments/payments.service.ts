import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { MediaAsset, Prisma } from "../generated/prisma/client.js";
import {
  MediaCategory,
  MediaStatus,
  PaymentProvider,
  PaymentStatus,
  RideRegistrationStatus,
} from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { bookingReference } from "../rides/booking-reference.js";
import type { RideRegistrationDto } from "../rides/dto/ride.dto.js";
import { latestPaymentInclude, registrationResponse } from "../rides/ride-booking.mapper.js";
import {
  PAYMENT_HOLD_MINUTES,
  holdDeadline,
  releaseLapsedHolds,
  requiresPayment,
} from "../rides/seat-hold.js";
import type {
  AdminPaymentDto,
  AdminPaymentListQueryDto,
  AdminPaymentSettingsDto,
  PaymentInfoDto,
  RejectPaymentDto,
  SubmitPaymentProofDto,
  UpdatePaymentSettingsDto,
} from "./dto/payment.dto.js";

/** The settings table holds one row. */
const SETTINGS_ID = 1;

const adminPaymentInclude = {
  proof: true,
  rideRegistration: {
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      ride: { select: { id: true, slug: true, title: true, startsAt: true } },
    },
  },
} satisfies Prisma.PaymentInclude;

type AdminPaymentRow = Prisma.PaymentGetPayload<{ include: typeof adminPaymentInclude }>;

const conflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message);

/**
 * Payments for ride bookings. Today there is one way to pay, manual UPI: the
 * rider pays outside the app, uploads a screenshot, and an admin approves or
 * rejects it. Only that approval marks a payment PAID and confirms the booking;
 * amounts always come from the booking, never from a client.
 *
 * A gateway would add its own way to create and settle `Payment` rows (the
 * `provider` column tells them apart). Booking, seat holds and the review of
 * manual proofs stay as they are.
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  // ─── UPI details ─────────────────────────────────────────────────────────

  /** What a signed-in rider needs to pay. */
  async info(): Promise<PaymentInfoDto> {
    const settings = await this.adminSettings();
    return {
      configured: settings.configured,
      upiId: settings.upiId,
      payeeName: settings.payeeName,
      instructions: settings.instructions,
      qr: settings.qr,
      holdMinutes: settings.holdMinutes,
    };
  }

  async adminSettings(): Promise<AdminPaymentSettingsDto> {
    const row = await this.prisma.paymentSettings.findUnique({
      where: { id: SETTINGS_ID },
      include: { qr: true },
    });
    return {
      configured: Boolean(row?.upiId),
      upiId: row?.upiId ?? null,
      payeeName: row?.payeeName ?? null,
      instructions: row?.instructions ?? null,
      qr: row?.qr ? this.image(row.qr) : null,
      holdMinutes: PAYMENT_HOLD_MINUTES,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  async updateSettings(
    admin: AuthUser,
    dto: UpdatePaymentSettingsDto,
  ): Promise<AdminPaymentSettingsDto> {
    const current = await this.prisma.paymentSettings.findUnique({ where: { id: SETTINGS_ID } });
    if (dto.qrMediaId && dto.qrMediaId !== current?.qrMediaId) {
      const asset = await this.media.assertAttachable(dto.qrMediaId, [MediaCategory.SITE]);
      if (!asset.mimeType.startsWith("image/")) throw notUsable("The QR code must be an image.");
    }
    const data = {
      ...(dto.upiId !== undefined ? { upiId: dto.upiId } : {}),
      ...(dto.payeeName !== undefined ? { payeeName: dto.payeeName } : {}),
      ...(dto.instructions !== undefined ? { instructions: dto.instructions } : {}),
      ...(dto.qrMediaId !== undefined ? { qrMediaId: dto.qrMediaId } : {}),
      updatedById: admin.id,
    };
    await this.prisma.paymentSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
    // A replaced QR image is deleted from storage once nothing else uses it.
    if (current?.qrMediaId && dto.qrMediaId !== undefined && dto.qrMediaId !== current.qrMediaId) {
      await this.media.releaseIfUnreferenced(current.qrMediaId);
    }
    this.logger.log({ adminId: admin.id, fields: Object.keys(dto) }, "Payment settings updated");
    return this.adminSettings();
  }

  // ─── Manual UPI: the rider's proof ───────────────────────────────────────

  /**
   * Records the rider's payment proof for their own booking on a ride. The
   * booking is found from the signed-in rider, so nobody can submit for someone
   * else's. It must be waiting for payment with its seat hold still running and
   * no proof already under review. From here the seat stays held until an admin
   * reviews the proof.
   */
  async submitRideProof(
    user: AuthUser,
    rideId: string,
    dto: SubmitPaymentProofDto,
  ): Promise<RideRegistrationDto> {
    const row = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      if (!(await lockRow(tx, "rides", rideId))) throw notFound("Ride");
      await releaseLapsedHolds(tx, { rideId, userId: user.id }, now);
      const booking = await tx.rideRegistration.findUnique({
        where: { rideId_userId: { rideId, userId: user.id } },
      });
      if (!booking) throw notFound("Booking");
      if (booking.status === RideRegistrationStatus.CANCELLED) {
        throw conflict(
          booking.holdExpiresAt
            ? "Your seat hold ran out before a payment proof arrived. Book again to pay."
            : "This booking is cancelled, so it can't take a payment proof.",
        );
      }
      if (
        booking.status !== RideRegistrationStatus.PENDING_PAYMENT ||
        !requiresPayment(booking.amount)
      ) {
        throw conflict("This booking is already confirmed and needs no payment proof.");
      }
      const underReview = await tx.payment.count({
        where: { rideRegistrationId: booking.id, status: PaymentStatus.PROOF_SUBMITTED },
      });
      if (underReview > 0) {
        throw conflict("A payment proof for this booking is already awaiting review.");
      }
      await this.assertOwnUnusedProof(tx, user, dto.mediaAssetId);

      await tx.payment.create({
        data: {
          rideRegistrationId: booking.id,
          provider: PaymentProvider.MANUAL_UPI,
          status: PaymentStatus.PROOF_SUBMITTED,
          // The price quoted on the booking. The client sends no amount.
          amount: booking.amount ?? 0,
          currency: booking.currency ?? "INR",
          proofMediaId: dto.mediaAssetId,
          // Same clock as the booking's `bookedAt`, which this is compared with.
          createdAt: now,
        },
      });
      return tx.rideRegistration.update({
        where: { id: booking.id },
        data: { holdExpiresAt: null },
        include: latestPaymentInclude,
      });
    });
    this.logger.log({ userId: user.id, rideId, booking: row.number }, "Payment proof submitted");
    return registrationResponse(rideId, row);
  }

  // ─── Manual UPI: the admin's review ──────────────────────────────────────

  async adminList(query: AdminPaymentListQueryDto): Promise<AdminPaymentDto[]> {
    const filter = query.status ?? "pending";
    const rows = await this.prisma.payment.findMany({
      where: {
        provider: PaymentProvider.MANUAL_UPI,
        rideRegistrationId: { not: null },
        ...(filter === "pending" ? { status: PaymentStatus.PROOF_SUBMITTED } : {}),
        ...(filter === "reviewed" ? { status: { not: PaymentStatus.PROOF_SUBMITTED } } : {}),
      },
      include: adminPaymentInclude,
      // Waiting proofs oldest first; history newest first.
      orderBy: { createdAt: filter === "pending" ? "asc" : "desc" },
      take: 200,
    });
    return rows.flatMap((row) => this.adminPayment(row));
  }

  /** Marks the payment PAID and confirms the booking. The seat it held stays taken. */
  async approve(admin: AuthUser, paymentId: string): Promise<AdminPaymentDto> {
    await this.review(paymentId, async (tx, payment, now) => {
      if (payment.booking.status !== RideRegistrationStatus.PENDING_PAYMENT) {
        throw conflict("This booking is no longer waiting for payment, so it can't be approved.");
      }
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          reviewedById: admin.id,
          reviewedAt: now,
          failureReason: null,
        },
      });
      await tx.rideRegistration.update({
        where: { id: payment.booking.id },
        data: { status: RideRegistrationStatus.REGISTERED, holdExpiresAt: null },
      });
    });
    this.logger.log({ adminId: admin.id, paymentId }, "Payment approved");
    return this.adminGet(paymentId);
  }

  /**
   * Marks the proof REJECTED and keeps it as history. The booking stays unpaid
   * and its seat is held for one more window so the rider can send a new proof.
   */
  async reject(
    admin: AuthUser,
    paymentId: string,
    dto: RejectPaymentDto,
  ): Promise<AdminPaymentDto> {
    await this.review(paymentId, async (tx, payment, now) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.REJECTED,
          reviewedById: admin.id,
          reviewedAt: now,
          failureReason: dto.reason ?? null,
        },
      });
      if (payment.booking.status === RideRegistrationStatus.PENDING_PAYMENT) {
        await tx.rideRegistration.update({
          where: { id: payment.booking.id },
          data: { holdExpiresAt: holdDeadline(now) },
        });
      }
    });
    this.logger.log({ adminId: admin.id, paymentId }, "Payment rejected");
    return this.adminGet(paymentId);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Runs one review decision under the ride's row lock, on a proof that is
   * still awaiting review. A proof can be decided only once.
   */
  private async review(
    paymentId: string,
    decide: (
      tx: Prisma.TransactionClient,
      payment: { id: string; booking: { id: string; status: RideRegistrationStatus } },
      now: Date,
    ) => Promise<void>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const found = await tx.payment.findFirst({
        where: { id: paymentId, provider: PaymentProvider.MANUAL_UPI },
        select: { rideRegistration: { select: { rideId: true } } },
      });
      if (!found?.rideRegistration) throw notFound("Payment");
      await lockRow(tx, "rides", found.rideRegistration.rideId);

      // Read again now that nothing else can change this ride's bookings.
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        select: {
          id: true,
          status: true,
          rideRegistration: { select: { id: true, status: true } },
        },
      });
      if (payment.status !== PaymentStatus.PROOF_SUBMITTED || !payment.rideRegistration) {
        throw conflict("This payment proof has already been reviewed or withdrawn.");
      }
      await decide(tx, { id: payment.id, booking: payment.rideRegistration }, new Date());
    });
  }

  private async adminGet(paymentId: string): Promise<AdminPaymentDto> {
    const row = await this.prisma.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: adminPaymentInclude,
    });
    const [payment] = this.adminPayment(row);
    if (!payment) throw notFound("Payment");
    return payment;
  }

  /** The proof must be the rider's own uploaded image and not attached to another payment. */
  private async assertOwnUnusedProof(
    tx: Prisma.TransactionClient,
    user: AuthUser,
    mediaAssetId: string,
  ): Promise<void> {
    const asset = await tx.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        ownerId: true,
        status: true,
        category: true,
        mimeType: true,
        _count: { select: { paymentProofs: true } },
      },
    });
    if (
      !asset ||
      asset.ownerId !== user.id ||
      asset.status !== MediaStatus.READY ||
      asset.category !== MediaCategory.PAYMENT_PROOF ||
      !asset.mimeType.startsWith("image/") ||
      asset._count.paymentProofs > 0
    ) {
      throw notUsable(
        "Upload a screenshot of your payment as an image, then submit it once for this booking.",
      );
    }
  }

  private adminPayment(row: AdminPaymentRow): AdminPaymentDto[] {
    const booking = row.rideRegistration;
    if (!booking) return [];
    return [
      {
        id: row.id,
        provider: row.provider,
        status: row.status,
        amount: row.amount,
        currency: row.currency,
        reference: bookingReference(booking.number),
        bookingStatus: booking.status,
        rider: {
          name: [booking.user.firstName, booking.user.lastName].filter(Boolean).join(" "),
          email: booking.user.email,
          phone: booking.contactPhone,
        },
        ride: booking.ride,
        proofUrl: row.proof?.status === MediaStatus.READY ? this.image(row.proof).url : null,
        submittedAt: row.createdAt,
        reviewedAt: row.reviewedAt,
        rejectionReason: row.status === PaymentStatus.REJECTED ? row.failureReason : null,
      },
    ];
  }

  private image(asset: MediaAsset) {
    return {
      id: asset.id,
      url: asset.status === MediaStatus.READY ? this.media.publicUrl(asset.storageKey) : null,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
    };
  }
}

function notUsable(message: string): ApiException {
  return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.MEDIA_NOT_USABLE, message);
}
