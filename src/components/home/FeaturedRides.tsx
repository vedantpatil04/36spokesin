import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Compass, MapPin, Route as RouteIcon } from "lucide-react";
import { ButtonLink, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { formatRideStart, rideAvailability } from "@/lib/ride-format";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";

export function FeaturedRides({ rides }: { rides: Ride[] }) {
  const publishedRides = rides.slice(0, 3);

  return (
    <Section id="featured-rides">
      <SectionHeader
        eyebrow="On the Road"
        title="Featured Upcoming Rides"
        description="This is what is happening on the tarmac. Day loops, weekend scrambles and group rides led by 36 Spokes crews."
        action={
          <ButtonLink to="/rides" variant="outline">
            All upcoming rides <ArrowRight className="size-3.5" aria-hidden />
          </ButtonLink>
        }
      />

      {publishedRides.length === 0 ? (
        <div className="mt-10 rounded-sm border border-border bg-card p-8 text-center sm:p-12">
          <RouteIcon className="mx-auto size-10 text-primary/60" aria-hidden />
          <h3 className="mt-4 font-display text-2xl uppercase text-foreground">
            New rides are being scouted
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Marshals post confirmed dates each week as weather and pass conditions are vetted.
            Explore our route blueprints in the meantime.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink to="/plan" variant="outline">
              Explore Route Blueprints
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {publishedRides.map((ride) => (
            <FeaturedRideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </Section>
  );
}

function FeaturedRideCard({ ride }: { ride: Ride }) {
  const imageSource = ride.image?.src || media.destinations.spiti.src;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card shadow-card transition-all duration-300 hover:border-border-strong hover:shadow-lift">
      {/* 16:9 Image Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-2">
        <img
          src={imageSource}
          alt={ride.name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />

        {/* Ride Type Badge */}
        <span className="absolute left-4 top-4 rounded-full border border-primary/40 bg-background/85 px-2.5 py-0.5 font-display text-[0.65rem] uppercase tracking-[0.18em] text-primary backdrop-blur-md">
          {ride.type}
        </span>

        {/* Date Overlay */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.16em] text-primary">
          <Calendar className="size-3.5" aria-hidden />
          <time dateTime={ride.startsAt}>{formatRideStart(ride.startsAt)}</time>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3 text-primary/80" aria-hidden />
            <span>{ride.location}</span>
          </div>

          <h3 className="mt-2 font-display text-xl uppercase leading-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
            <Link to="/rides/$slug" params={{ slug: ride.slug }}>
              {ride.name}
            </Link>
          </h3>

          {ride.summary || ride.routeSummary ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {ride.summary || ride.routeSummary}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
          <span className="font-medium text-foreground/85">
            {ride.route.distanceKm ? `${ride.route.distanceKm} km` : ride.duration || "Day ride"}
          </span>

          <span
            className={cn(
              "font-display uppercase tracking-[0.14em]",
              ride.spotsLeft === 0 ? "text-warning" : "text-primary",
            )}
          >
            {rideAvailability(ride)}
          </span>
        </div>
      </div>
    </article>
  );
}
