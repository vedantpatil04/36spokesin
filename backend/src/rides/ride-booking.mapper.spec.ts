import { PaymentStatus, RideRegistrationStatus } from "../generated/prisma/enums.js";
import {
  type BookingRow,
  RidePaymentStatus,
  currentPayment,
  registrationResponse,
  ridePaymentStatus,
} from "./ride-booking.mapper.js";
import { PAYMENT_HOLD_MINUTES, holdDeadline, holdsSeat, requiresPayment } from "./seat-hold.js";

const NOW = new Date("2026-10-02T10:00:00Z");
const minutes = (n: number) => new Date(NOW.getTime() + n * 60_000);

const { PENDING_PAYMENT, REGISTERED, CANCELLED } = RideRegistrationStatus;

function booking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: "booking-1",
    number: 7,
    rideId: "ride-1",
    userId: "user-1",
    status: PENDING_PAYMENT,
    contactPhone: "+919876543210",
    bikeLabel: null,
    note: null,
    amount: 99900,
    currency: "INR",
    holdExpiresAt: minutes(20),
    bookedAt: NOW,
    cancelledAt: null,
    createdAt: minutes(-600),
    updatedAt: NOW,
    payments: [],
    ...overrides,
  };
}

function payment(status: PaymentStatus, createdAt: Date, failureReason: string | null = null) {
  return { status, createdAt, failureReason } as BookingRow["payments"][number];
}

describe("seat holds", () => {
  it("needs payment only when the price is above zero", () => {
    expect(requiresPayment(99900)).toBe(true);
    expect(requiresPayment(0)).toBe(false);
    expect(requiresPayment(null)).toBe(false);
  });

  it("holds a seat for the configured window", () => {
    expect(holdDeadline(NOW).getTime() - NOW.getTime()).toBe(PAYMENT_HOLD_MINUTES * 60_000);
  });

  it("counts confirmed bookings, running holds and proofs under review, nothing else", () => {
    expect(holdsSeat({ status: REGISTERED, holdExpiresAt: null }, NOW)).toBe(true);
    expect(holdsSeat({ status: PENDING_PAYMENT, holdExpiresAt: minutes(1) }, NOW)).toBe(true);
    // No expiry: a proof is with the admin.
    expect(holdsSeat({ status: PENDING_PAYMENT, holdExpiresAt: null }, NOW)).toBe(true);
    expect(holdsSeat({ status: PENDING_PAYMENT, holdExpiresAt: minutes(-1) }, NOW)).toBe(false);
    expect(holdsSeat({ status: PENDING_PAYMENT, holdExpiresAt: NOW }, NOW)).toBe(false);
    expect(holdsSeat({ status: CANCELLED, holdExpiresAt: null }, NOW)).toBe(false);
  });
});

describe("ridePaymentStatus", () => {
  it("asks nothing of a free ride", () => {
    expect(ridePaymentStatus({ status: REGISTERED, amount: null }, null)).toBe(
      RidePaymentStatus.NOT_REQUIRED,
    );
  });

  it("follows the booking's payment through review", () => {
    const pending = { status: PENDING_PAYMENT, amount: 99900 };
    expect(ridePaymentStatus(pending, null)).toBe(RidePaymentStatus.UNPAID);
    expect(ridePaymentStatus(pending, { status: PaymentStatus.PROOF_SUBMITTED })).toBe(
      RidePaymentStatus.PROOF_SUBMITTED,
    );
    expect(ridePaymentStatus(pending, { status: PaymentStatus.REJECTED })).toBe(
      RidePaymentStatus.REJECTED,
    );
    expect(
      ridePaymentStatus({ status: REGISTERED, amount: 99900 }, { status: PaymentStatus.PAID }),
    ).toBe(RidePaymentStatus.PAID);
  });

  it("reports a cancelled booking as cancelled unless its payment was verified", () => {
    const cancelled = { status: CANCELLED, amount: 99900 };
    expect(ridePaymentStatus(cancelled, { status: PaymentStatus.CANCELLED })).toBe(
      RidePaymentStatus.CANCELLED,
    );
    expect(ridePaymentStatus(cancelled, { status: PaymentStatus.PAID })).toBe(
      RidePaymentStatus.PAID,
    );
  });

  it("shows a paid ride confirmed before payments existed as unpaid", () => {
    expect(ridePaymentStatus({ status: REGISTERED, amount: 99900 }, null)).toBe(
      RidePaymentStatus.UNPAID,
    );
  });
});

describe("registrationResponse", () => {
  it("answers for a rider with no booking", () => {
    expect(registrationResponse("ride-1", null)).toMatchObject({
      registered: false,
      status: null,
      paymentStatus: null,
      reference: null,
      holdExpired: false,
    });
  });

  it("shows the hold while payment is due", () => {
    expect(registrationResponse("ride-1", booking())).toMatchObject({
      registered: false,
      status: PENDING_PAYMENT,
      paymentStatus: RidePaymentStatus.UNPAID,
      reference: "36S-000007",
      amount: 99900,
      holdExpiresAt: minutes(20),
      holdExpired: false,
    });
  });

  it("gives the reason once a proof is rejected, and only then", () => {
    const rejected = booking({
      payments: [payment(PaymentStatus.REJECTED, minutes(5), "Amount doesn't match")],
    });
    expect(registrationResponse("ride-1", rejected)).toMatchObject({
      paymentStatus: RidePaymentStatus.REJECTED,
      paymentRejectionReason: "Amount doesn't match",
    });
    const paid = booking({
      status: REGISTERED,
      holdExpiresAt: null,
      payments: [payment(PaymentStatus.PAID, minutes(5), "stale note")],
    });
    expect(registrationResponse("ride-1", paid)).toMatchObject({
      registered: true,
      paymentStatus: RidePaymentStatus.PAID,
      paymentRejectionReason: null,
      holdExpiresAt: null,
    });
  });

  it("ignores payments made before the rider booked again", () => {
    const rebooked = booking({
      payments: [payment(PaymentStatus.REJECTED, minutes(-60), "old booking")],
    });
    expect(currentPayment(rebooked)).toBeNull();
    expect(registrationResponse("ride-1", rebooked)).toMatchObject({
      paymentStatus: RidePaymentStatus.UNPAID,
      paymentRejectionReason: null,
      paymentSubmittedAt: null,
    });
  });

  it("tells a lapsed hold apart from a rider's own cancellation", () => {
    const lapsed = booking({ status: CANCELLED, cancelledAt: NOW, holdExpiresAt: minutes(-1) });
    expect(registrationResponse("ride-1", lapsed)).toMatchObject({
      status: CANCELLED,
      paymentStatus: RidePaymentStatus.CANCELLED,
      holdExpired: true,
      holdExpiresAt: null,
    });
    const byRider = booking({ status: CANCELLED, cancelledAt: NOW, holdExpiresAt: null });
    expect(registrationResponse("ride-1", byRider).holdExpired).toBe(false);
  });
});
