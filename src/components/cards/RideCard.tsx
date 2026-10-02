import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { RideMedia } from "@/components/rides/RideMedia";
import { Badge } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import { formatRideStart, rideAvailability, rideDestination } from "@/lib/ride-format";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";
import { cardBase, stretchedCardFocus, stretchedControl } from "./card-styles";

export function RideCard({ ride }: { ride: Ride }) {
  const closed = ride.status === "cancelled" || ride.status === "completed";
  const destination = rideDestination(ride);
  return (
    <article className={cn(cardBase, stretchedCardFocus)}>
      <RideMedia ride={ride} ratio="16/9" imgClassName="group-hover:scale-[1.04]">
        <span className="absolute left-4 top-4">
          <Badge tone="primary">{ride.type}</Badge>
        </span>
      </RideMedia>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <time dateTime={ride.startsAt} className="uppercase tracking-[0.14em] text-primary">
            {formatRideStart(ride.startsAt)}
          </time>
          <span className="text-muted-foreground">{ride.location}</span>
        </div>
        <div>
          <h3 className="text-xl leading-tight">
            <Link to="/rides/$slug" params={{ slug: ride.slug }} className={stretchedControl}>
              {ride.name}
            </Link>
          </h3>
          {destination ? <p className="mt-1 text-sm text-muted-foreground">{destination}</p> : null}
        </div>
        <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-muted-foreground">
          {ride.route.distanceKm !== null ? <li>{ride.route.distanceKm} km</li> : null}
          {ride.duration ? <li>{ride.duration}</li> : null}
          {ride.price !== null ? <li>{formatINR(ride.price)}</li> : null}
          <li className={closed || ride.spotsLeft === 0 ? "text-warning" : undefined}>
            {rideAvailability(ride)}
          </li>
        </ul>
        <span
          aria-hidden
          className="inline-flex items-center gap-1.5 border-t border-border pt-3 font-display text-xs uppercase tracking-[0.16em] text-foreground transition-colors group-hover:text-primary"
        >
          View ride <ArrowRight className="size-3.5" />
        </span>
      </div>
    </article>
  );
}
