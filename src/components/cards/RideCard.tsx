import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";
import { stretchedCardFocus, stretchedControl } from "./card-styles";

export function RideCard({ ride }: { ride: Ride }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary/60",
        stretchedCardFocus,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Badge tone="primary">{ride.type}</Badge>
        <span className="text-xs text-muted-foreground">{ride.location}</span>
      </div>
      <h3 className="text-xl leading-tight">
        <Link to="/rides/$slug" params={{ slug: ride.slug }} className={stretchedControl}>
          {ride.name}
        </Link>
      </h3>
      <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-muted-foreground">
        <li>{ride.route.distanceKm} km</li>
        <li>{ride.duration}</li>
        <li>{ride.difficulty}</li>
        <li>{ride.riders} riders</li>
      </ul>
    </article>
  );
}
