import { CircleCheck } from "lucide-react";
import { Badge, ButtonLink } from "@/components/ui-kit";
import type { ApiUser } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { BOOKING_STATUS_LABEL } from "@/lib/ride-format";
import type { Ride, RideRegistration } from "@/types";
import { CancelBookingButton } from "./CancelBookingButton";

/**
 * The rider's confirmed booking as the API stored it, with the booking ID to
 * quote and the way to cancel.
 */
export function RideBookingSummary({
  ride,
  booking,
  user,
  heading,
  onCancelled,
  onStale,
}: {
  ride: Ride;
  booking: RideRegistration;
  user: ApiUser;
  heading: string;
  onCancelled: (booking: RideRegistration) => void;
  /** The API no longer agrees with what is shown (e.g. cancelled in another tab). */
  onStale: () => void;
}) {
  const details = [
    { label: "Booking ID", value: booking.reference ?? "" },
    { label: "Status", value: booking.status ? BOOKING_STATUS_LABEL[booking.status] : "" },
    ...(booking.paymentVerified ? [{ label: "Payment", value: "Verified" }] : []),
    { label: "Booked as", value: [user.firstName, user.lastName].filter(Boolean).join(" ") },
    { label: "Email", value: user.email },
    ...(booking.contactPhone ? [{ label: "Phone", value: booking.contactPhone }] : []),
    ...(booking.bikeLabel ? [{ label: "Motorcycle", value: booking.bikeLabel }] : []),
    {
      label: "Price",
      value: booking.amount !== null ? `${formatINR(booking.amount)} per rider` : "Free",
    },
    ...(booking.note ? [{ label: "Your note", value: booking.note }] : []),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <CircleCheck className="size-8 text-success" aria-hidden />
        <Badge tone="success">Booked</Badge>
        {booking.paymentVerified ? <Badge tone="success">Payment verified</Badge> : null}
      </div>
      <h1 className="mt-4 text-3xl leading-[1.05] sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-base text-muted-foreground">
        Your seat on {ride.name} is confirmed. Booking ID{" "}
        <span className="font-display text-foreground">{booking.reference}</span>.
      </p>

      <dl className="mt-6 divide-y divide-border rounded-sm border border-border bg-card">
        {details.map((detail) => (
          <div key={detail.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground sm:pt-0.5">
              {detail.label}
            </dt>
            <dd className="whitespace-pre-line break-words text-sm text-foreground">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink to="/rides/$slug" params={{ slug: ride.slug }} size="lg">
          View ride
        </ButtonLink>
        <ButtonLink to="/my-36-spokes/rides" variant="outline" size="lg">
          My rides
        </ButtonLink>
      </div>

      <CancelBookingButton
        ride={ride}
        onCancelled={onCancelled}
        onStale={onStale}
        warning={
          booking.paymentVerified && booking.amount !== null
            ? `Your payment of ${formatINR(booking.amount)} has been verified. Cancelling doesn't refund it automatically; contact the crew about a refund.`
            : undefined
        }
      />
    </div>
  );
}
