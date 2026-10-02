import type { RideBookingStatus, Ride } from "@/types";
import { formatINR } from "./format";

/** Ride times are shown in India time, identically on server and client. */
const rideDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});
const rideDateWithYear = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const rideTime = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const rideDay = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/** "Sat, 4 Oct · 6:00 am" */
export const formatRideStart = (iso: string) => {
  const date = new Date(iso);
  return `${rideDate.format(date)} · ${rideTime.format(date)}`;
};

/** "Sat, 4 October 2026" */
export const formatRideDate = (iso: string) => rideDateWithYear.format(new Date(iso));

/** "6:00 am" */
export const formatRideTime = (iso: string) => rideTime.format(new Date(iso));

/** { day: "04", month: "Oct", year: "2026" } for the date plate shown when a ride has no photo. */
export function rideDateParts(iso: string): { day: string; month: string; year: string } {
  const parts = Object.fromEntries(
    rideDay.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return { day: parts["day"] ?? "", month: parts["month"] ?? "", year: parts["year"] ?? "" };
}

/** "₹999 per rider", or "Free" when the ride has no price. */
export const formatRidePrice = (ride: Pick<Ride, "price">) =>
  ride.price !== null ? `${formatINR(ride.price)} per rider` : "Free";

/** Where the ride is headed, when its route says so. */
export const rideDestination = (ride: Pick<Ride, "route">) => ride.route.finish;

/** Short status line for cards and headers. */
export function rideAvailability(
  ride: Pick<Ride, "status" | "spotsLeft" | "registrationOpen">,
): string {
  if (ride.status === "cancelled") return "Cancelled";
  if (ride.status === "completed") return "Completed";
  if (ride.status === "full" || ride.spotsLeft === 0) return "Full";
  if (!ride.registrationOpen) return "Registration closed";
  return `${ride.spotsLeft} spot${ride.spotsLeft === 1 ? "" : "s"} left`;
}

/** Availability with the ride's capacity: "12 of 15 spots left", or the closed reason. */
export function rideSeats(
  ride: Pick<Ride, "status" | "spotsLeft" | "registrationOpen" | "capacity">,
): string {
  return ride.registrationOpen
    ? `${ride.spotsLeft} of ${ride.capacity} spots left`
    : rideAvailability(ride);
}

/** How a booking's status reads to a rider. */
export const BOOKING_STATUS_LABEL: Record<RideBookingStatus, string> = {
  "payment-required": "Payment required",
  "payment-under-review": "Payment under review",
  "payment-rejected": "Payment rejected",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export type RideDescriptionBlock =
  { kind: "text"; text: string } | { kind: "list"; title: string | null; items: string[] };

const BULLET = /^[-•*]\s+/;

/**
 * Splits a ride's plain-text description into paragraphs and lists. Blank lines
 * separate blocks; a block whose lines start with "- " is a list, and a first
 * line ending in ":" ("Included:") is that list's title.
 */
export function parseRideDescription(description: string | null): RideDescriptionBlock[] {
  if (!description) return [];
  return description.split(/\n{2,}/).flatMap((block): RideDescriptionBlock[] => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const [first, ...rest] = lines;
    if (first === undefined) return [];
    const titled = first.endsWith(":") && rest.length > 0 && rest.every((l) => BULLET.test(l));
    const items = titled ? rest : lines;
    if (!items.every((line) => BULLET.test(line))) {
      return [{ kind: "text", text: lines.join("\n") }];
    }
    return [
      {
        kind: "list",
        title: titled ? first.slice(0, -1).trim() : null,
        items: items.map((line) => line.replace(BULLET, "")),
      },
    ];
  });
}
