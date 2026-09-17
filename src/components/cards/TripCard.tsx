import { Link } from "@tanstack/react-router";
import { Badge, DetailList, Media } from "@/components/ui-kit";
import { formatCompactDateRange } from "@/lib/dates";
import { formatINR, formatNumber } from "@/lib/format";
import { nextDeparture } from "@/lib/travel";
import type { Trip } from "@/types";
import { cardBase } from "./card-styles";

export function TripCard({ trip }: { trip: Trip }) {
  const departure = nextDeparture(trip);

  return (
    <article className={cardBase}>
      <Media
        asset={trip.image}
        alt={trip.name}
        ratio="16/10"
        imgClassName="group-hover:scale-[1.04]"
      >
        {departure ? (
          <span className="absolute left-4 top-4">
            <Badge tone={departure.seatsLeft <= 5 ? "warning" : "neutral"}>
              {departure.seatsLeft} seats left
            </Badge>
          </span>
        ) : null}
      </Media>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-primary">
          {departure
            ? formatCompactDateRange(departure.startDate, departure.endDate)
            : "Dates to be announced"}
        </p>
        <h3 className="mt-2 text-xl leading-tight">{trip.name}</h3>
        <DetailList
          className="mt-4"
          items={[
            { label: "Duration", value: `${trip.days} days` },
            { label: "Distance", value: `${formatNumber(trip.distanceKm)} km` },
            { label: "Starts", value: trip.startLocation },
            { label: "Grade", value: trip.difficulty },
          ]}
        />
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="font-display text-lg">
            {departure ? formatINR(departure.price) : null}
          </span>
          <Link
            to="/travel/trips/$slug"
            params={{ slug: trip.slug }}
            className="font-display text-xs uppercase tracking-[0.18em] text-primary hover:underline"
          >
            View trip<span className="sr-only">: {trip.name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
