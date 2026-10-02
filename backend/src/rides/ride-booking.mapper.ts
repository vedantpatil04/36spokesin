import type { Prisma } from "../generated/prisma/client.js";
import { PaymentStatus, RideRegistrationStatus } from "../generated/prisma/enums.js";
import { bookingReference } from "./booking-reference.js";
import type { RideRegistrationDto } from "./dto/ride.dto.js";
import { requiresPayment } from "./seat-hold.js";

/**
 * Where a booking stands on payment, as riders and the crew see it. Derived
 * from the booking and its latest payment, never sent by a client.
 */
export const RidePaymentStatus = {
  /** Free ride: nothing to pay. */
  NOT_REQUIRED: "NOT_REQUIRED",
  /** Paid ride, no proof submitted for this booking. */
  UNPAID: "UNPAID",
  /** Proof submitted and awaiting an admin's review. */
  PROOF_SUBMITTED: "PROOF_SUBMITTED",
  /** An admin verified the payment. */
  PAID: "PAID",
  /** An admin rejected the latest proof; the rider may send another. */
  REJECTED: "REJECTED",
  /** The booking was cancelled before a payment was verified. */
  CANCELLED: "CANCELLED",
} as const;
export type RidePaymentStatus = (typeof RidePaymentStatus)[keyof typeof RidePaymentStatus];

/** The newest payment on a booking; older ones are history. */
export const latestPaymentInclude = {
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
} as const satisfies Prisma.RideRegistrationInclude;

export type BookingRow = Prisma.RideRegistrationGetPayload<{
  include: typeof latestPaymentInclude;
}>;

/**
 * The payment that belongs to the booking as it stands now. A rider who cancels
 * and books again reuses the row, so payments made before `bookedAt` belong to
 * the earlier booking and don't count.
 */
export function currentPayment(row: BookingRow): BookingRow["payments"][number] | null {
  const latest = row.payments[0];
  return latest && latest.createdAt >= row.bookedAt ? latest : null;
}

export function ridePaymentStatus(
  booking: { status: RideRegistrationStatus; amount: number | null },
  payment: { status: PaymentStatus } | null,
): RidePaymentStatus {
  if (!requiresPayment(booking.amount)) return RidePaymentStatus.NOT_REQUIRED;
  if (payment?.status === PaymentStatus.PAID) return RidePaymentStatus.PAID;
  if (booking.status === RideRegistrationStatus.CANCELLED) return RidePaymentStatus.CANCELLED;
  if (payment?.status === PaymentStatus.PROOF_SUBMITTED) return RidePaymentStatus.PROOF_SUBMITTED;
  if (payment?.status === PaymentStatus.REJECTED) return RidePaymentStatus.REJECTED;
  return RidePaymentStatus.UNPAID;
}

/** The rider's own booking on a ride, or the empty answer when they have none. */
export function registrationResponse(rideId: string, row: BookingRow | null): RideRegistrationDto {
  const payment = row ? currentPayment(row) : null;
  const paymentStatus = row ? ridePaymentStatus(row, payment) : null;
  const cancelled = row?.status === RideRegistrationStatus.CANCELLED;
  return {
    rideId,
    registered: row?.status === RideRegistrationStatus.REGISTERED,
    number: row?.number ?? null,
    reference: row ? bookingReference(row.number) : null,
    contactPhone: row?.contactPhone ?? null,
    bikeLabel: row?.bikeLabel ?? null,
    note: row?.note ?? null,
    amount: row?.amount ?? null,
    currency: row?.currency ?? null,
    status: row?.status ?? null,
    paymentStatus,
    holdExpiresAt:
      row?.status === RideRegistrationStatus.PENDING_PAYMENT ? row.holdExpiresAt : null,
    holdExpired: cancelled && row.holdExpiresAt !== null,
    paymentSubmittedAt: payment?.createdAt ?? null,
    paymentRejectionReason:
      paymentStatus === RidePaymentStatus.REJECTED ? (payment?.failureReason ?? null) : null,
    registeredAt: row?.bookedAt ?? null,
    cancelledAt: row?.cancelledAt ?? null,
  };
}
