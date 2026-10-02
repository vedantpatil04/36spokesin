import { Link } from "@tanstack/react-router";
import { formatRideStart } from "@/lib/ride-format";
import type { RideRef } from "@/types";

/** Upcoming rides linked to a destination or trip. Renders nothing when there are none. */
export function LinkedRides({ rides }: { rides: RideRef[] }) {
  if (rides.length === 0) return null;
  return (
    <ul className="divide-y divide-border rounded-sm border border-border bg-card">
      {rides.map((ride) => (
        <li key={ride.slug} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <Link
            to="/rides/$slug"
            params={{ slug: ride.slug }}
            className="font-semibold hover:text-primary"
          >
            {ride.name}
          </Link>
          <time
            dateTime={ride.startsAt}
            className="text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            {formatRideStart(ride.startsAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
