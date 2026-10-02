/**
 * Rides and ride registration from the 36 Spokes API. Listing and detail are
 * public (SSR-safe); registration calls need the rider's token (browser only).
 */

import { getApiClient } from "@/lib/api";
import type {
  ApiMyRide,
  ApiPaymentInfo,
  ApiRideBookingStatus,
  ApiRideDetail,
  ApiRidePaymentStatus,
  ApiRideRegistration,
  ApiRideSummary,
} from "@/lib/api";
import { minorToRupees } from "@/lib/money";
import type {
  ID,
  MyRide,
  PaymentInfo,
  Ride,
  RideBookingInput,
  RideBookingStatus,
  RideDetail,
  RideRegistration,
  RideType,
  RideTypeSlug,
} from "@/types";
import { orNull } from "./request-helpers";
import { RIDE_TYPES, toRide, toRideDetail } from "./travel-mappers";

export async function listRides(
  filter: { type?: RideTypeSlug; when?: "upcoming" | "past"; destinationSlug?: string } = {},
): Promise<Ride[]> {
  const rows = await getApiClient().request<ApiRideSummary[]>("/rides", {
    auth: false,
    query: {
      type: RIDE_TYPES.find((type) => type.slug === filter.type)?.api,
      when: filter.when,
      destination: filter.destinationSlug,
    },
  });
  return rows.map(toRide);
}

export async function getRideBySlug(slug: string): Promise<RideDetail | null> {
  const row = await orNull(
    getApiClient().request<ApiRideDetail>(`/rides/${encodeURIComponent(slug)}`, { auth: false }),
  );
  return row ? toRideDetail(row) : null;
}

/** The rider-facing state of a booking, from the API's booking and payment statuses. */
function bookingStatus(
  status: ApiRideBookingStatus,
  payment: ApiRidePaymentStatus | null,
): RideBookingStatus {
  if (status === "REGISTERED") return "confirmed";
  if (status === "CANCELLED") return "cancelled";
  if (payment === "PROOF_SUBMITTED") return "payment-under-review";
  return payment === "REJECTED" ? "payment-rejected" : "payment-required";
}

const toRegistration = (api: ApiRideRegistration): RideRegistration => ({
  rideId: api.rideId,
  registered: api.registered,
  status: api.status ? bookingStatus(api.status, api.paymentStatus) : null,
  bookingNumber: api.number,
  reference: api.reference,
  contactPhone: api.contactPhone,
  bikeLabel: api.bikeLabel,
  note: api.note,
  amount: api.amount !== null ? minorToRupees(api.amount) : null,
  paymentVerified: api.paymentStatus === "PAID",
  holdExpiresAt: api.holdExpiresAt,
  holdExpired: api.holdExpired,
  paymentRejectionReason: api.paymentRejectionReason,
  registeredAt: api.registeredAt,
  cancelledAt: api.cancelledAt,
});

export async function getRideRegistration(rideId: ID): Promise<RideRegistration> {
  return toRegistration(
    await getApiClient().request<ApiRideRegistration>(`/rides/${rideId}/registration`),
  );
}

/** Books the signed-in rider onto a ride. The API validates and stores the booking. */
export async function bookRide(rideId: ID, input: RideBookingInput): Promise<RideRegistration> {
  return toRegistration(
    await getApiClient().request<ApiRideRegistration>(`/rides/${rideId}/join`, {
      method: "POST",
      body: input,
    }),
  );
}

/** Cancels the signed-in rider's booking. The API keeps it as history and frees the seat. */
export async function cancelRideBooking(rideId: ID): Promise<RideRegistration> {
  return toRegistration(
    await getApiClient().request<ApiRideRegistration>(`/rides/${rideId}/join`, {
      method: "DELETE",
    }),
  );
}

/** Where to pay for a paid ride. Signed-in riders only. */
export async function getPaymentInfo(): Promise<PaymentInfo> {
  const api = await getApiClient().request<ApiPaymentInfo>("/payment-info");
  return {
    configured: api.configured,
    upiId: api.upiId,
    payeeName: api.payeeName,
    instructions: api.instructions,
    qrUrl: api.qr?.url ?? null,
    holdMinutes: api.holdMinutes,
  };
}

/**
 * Submits the uploaded screenshot as proof of payment for the rider's booking.
 * Only the image is sent: the API takes the amount from the booking.
 */
export async function submitPaymentProof(rideId: ID, mediaAssetId: ID): Promise<RideRegistration> {
  return toRegistration(
    await getApiClient().request<ApiRideRegistration>(`/rides/${rideId}/payment-proof`, {
      method: "POST",
      body: { mediaAssetId },
    }),
  );
}

export async function listMyRides(): Promise<MyRide[]> {
  const rows = await getApiClient().request<ApiMyRide[]>("/my-rides");
  return rows.map((row) => ({
    ride: toRide(row.ride),
    bookingNumber: row.bookingNumber,
    reference: row.reference,
    status: bookingStatus(row.status, row.paymentStatus),
    registeredAt: row.registeredAt,
    cancelledAt: row.cancelledAt,
  }));
}

export function listRideTypes(): { slug: RideTypeSlug; label: RideType }[] {
  return RIDE_TYPES.map(({ slug, label }) => ({ slug, label }));
}

export function rideTypeLabel(slug: RideTypeSlug): RideType | undefined {
  return RIDE_TYPES.find((type) => type.slug === slug)?.label;
}

/** Narrows an untrusted URL value to a known ride type slug. */
export function parseRideTypeSlug(value: unknown): RideTypeSlug | undefined {
  return RIDE_TYPES.find((type) => type.slug === value)?.slug;
}
