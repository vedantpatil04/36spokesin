import type { Prisma } from "../generated/prisma/client.js";
import { RideRegistrationStatus } from "../generated/prisma/enums.js";

/**
 * How long a seat on a paid ride is held while the rider pays and uploads their
 * proof. Once a proof is in, the seat stays held until an admin reviews it.
 */
export const PAYMENT_HOLD_MINUTES = 30;

export const holdDeadline = (now: Date): Date =>
  new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60_000);

/** A booking on a ride with a price above zero must be paid for before it is confirmed. */
export const requiresPayment = (amount: number | null): boolean => (amount ?? 0) > 0;

type Hold = { status: RideRegistrationStatus; holdExpiresAt: Date | null };

/**
 * Which bookings take a seat: confirmed ones, and unpaid ones whose hold is
 * still running or whose proof is under review (no expiry). A lapsed hold and a
 * cancelled booking take none.
 */
export function holdsSeat(booking: Hold, now: Date): boolean {
  if (booking.status === RideRegistrationStatus.REGISTERED) return true;
  if (booking.status !== RideRegistrationStatus.PENDING_PAYMENT) return false;
  return booking.holdExpiresAt === null || booking.holdExpiresAt > now;
}

/** The same rule as `holdsSeat`, for counting seats in the database. */
export const seatHoldingWhere = (now: Date): Prisma.RideRegistrationWhereInput => ({
  OR: [
    { status: RideRegistrationStatus.REGISTERED },
    {
      status: RideRegistrationStatus.PENDING_PAYMENT,
      OR: [{ holdExpiresAt: null }, { holdExpiresAt: { gt: now } }],
    },
  ],
});

/**
 * Turns lapsed holds into cancelled bookings so what is stored matches what is
 * counted. Runs wherever bookings are read or written; there is no scheduler.
 * `holdExpiresAt` is left in place: it marks the cancellation as a lapsed hold.
 */
export async function releaseLapsedHolds(
  client: Prisma.TransactionClient,
  where: Prisma.RideRegistrationWhereInput,
  now: Date,
): Promise<number> {
  const { count } = await client.rideRegistration.updateMany({
    where: {
      ...where,
      status: RideRegistrationStatus.PENDING_PAYMENT,
      holdExpiresAt: { lte: now },
    },
    data: { status: RideRegistrationStatus.CANCELLED, cancelledAt: now },
  });
  return count;
}
