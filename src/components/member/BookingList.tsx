import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui-kit";
import { formatDateRange } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import type { BookingStatus, BookingSummary } from "@/types";

const statusTone: Record<BookingStatus, "success" | "warning" | "neutral"> = {
  confirmed: "success",
  held: "warning",
  enquiry: "neutral",
  cancelled: "neutral",
};

const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  held: "Seat held",
  enquiry: "Enquiry",
  cancelled: "Cancelled",
};

export function BookingList({ bookings }: { bookings: BookingSummary[] }) {
  return (
    <ul className="mt-4 divide-y divide-border">
      {bookings.map((booking) => (
        <li
          key={booking.id}
          className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <Link
              to="/travel/trips/$slug"
              params={{ slug: booking.trip.slug }}
              className="font-display text-base uppercase hover:text-primary"
            >
              {booking.trip.name}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateRange(booking.departure.startDate, booking.departure.endDate)}{" "}
              <span aria-hidden>·</span> {booking.seats} {booking.seats === 1 ? "seat" : "seats"}{" "}
              <span aria-hidden>·</span> {formatINR(booking.amount)}
            </p>
          </div>
          <Badge tone={statusTone[booking.status]}>{statusLabel[booking.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
