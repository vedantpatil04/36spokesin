import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { stretchedCardFocus, stretchedControl } from "@/components/cards/card-styles";
import { Badge, buttonClasses } from "@/components/ui-kit";
import { formatRidePrice, formatRideStart, rideDestination, rideSeats } from "@/lib/ride-format";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";
import { RideMedia } from "./RideMedia";

/** The lead ride on /rides: photo, the facts a rider scans for, one action. */
export function FeaturedRide({ ride }: { ride: Ride }) {
  const destination = rideDestination(ride);
  const facts = [
    ...(ride.route.distanceKm !== null
      ? [{ label: "Distance", value: `${ride.route.distanceKm} km` }]
      : []),
    ...(ride.duration ? [{ label: "Duration", value: ride.duration }] : []),
    { label: "Price", value: formatRidePrice(ride) },
    { label: "Seats", value: rideSeats(ride) },
  ];

  return (
    <article
      className={cn(
        "group relative grid overflow-hidden rounded-sm border border-border bg-card shadow-card transition-colors hover:border-border-strong lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
        stretchedCardFocus,
      )}
    >
      {/* From lg the photo fills its column, whatever height the details need. */}
      <div className="relative lg:min-h-[24rem]">
        <RideMedia
          ride={ride}
          ratio="photo"
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="lg:absolute lg:inset-0 lg:h-full lg:w-full"
          imgClassName="group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-col p-5 sm:p-7 lg:p-9">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Badge tone="primary">{ride.type}</Badge>
          <time
            dateTime={ride.startsAt}
            className="font-display text-xs uppercase tracking-[0.16em] text-primary"
          >
            {formatRideStart(ride.startsAt)}
          </time>
        </div>
        <h3 className="mt-4 text-3xl leading-[1.05] sm:text-4xl">
          <Link to="/rides/$slug" params={{ slug: ride.slug }} className={stretchedControl}>
            {ride.name}
          </Link>
        </h3>
        {destination ? (
          <p className="mt-2 font-display text-sm uppercase tracking-[0.16em] text-muted-foreground">
            {destination}
          </p>
        ) : null}
        {ride.summary ? (
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {ride.summary}
          </p>
        ) : null}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-1 font-display text-base uppercase text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
        {/* The title link covers the card; this is its visible call to action. */}
        <span aria-hidden className={buttonClasses({ size: "lg", className: "mt-7 self-start" })}>
          View ride <ArrowRight className="size-4" />
        </span>
      </div>
    </article>
  );
}
