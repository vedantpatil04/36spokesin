import { Link } from "@tanstack/react-router";
import { Badge, Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import {
  formatINR,
  type Bike,
  type Destination,
  type Product,
  type Ride,
  type Rider,
  type Story,
  type Trip,
} from "@/data/content";

const cardBase =
  "group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card shadow-card transition-colors hover:border-border-strong";

/* ---------------------------------- Bike ----------------------------------- */

export function BikeCard({
  bike,
  selected,
  onSelect,
}: {
  bike: Bike;
  selected?: boolean;
  onSelect?: (bike: Bike) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect?.(bike)}
      className={cn(
        cardBase,
        "w-full cursor-pointer text-left",
        selected && "border-primary ring-1 ring-primary/40",
      )}
    >
      <Media src={bike.image} alt={`${bike.brand} ${bike.model}`} ratio="4/3" imgClassName="group-hover:scale-[1.04]" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">{bike.brand}</p>
        <h3 className="text-lg leading-tight">{bike.model}</h3>
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {bike.variant} · {bike.segment}
        </p>
      </div>
      {selected ? (
        <span className="absolute right-3 top-3">
          <Badge tone="primary">Selected</Badge>
        </span>
      ) : null}
    </button>
  );
}

/* --------------------------------- Product --------------------------------- */

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className={cardBase}>
      <Link to="/shop" aria-label={product.name} className="block">
        <Media src={product.image} alt={product.name} ratio="1/1" imgClassName="group-hover:scale-[1.04]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">{product.category}</p>
        <h3 className="text-base normal-case leading-snug font-sans font-semibold">{product.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden>★</span>
          <span>
            {product.rating.toFixed(1)} ({product.reviews})
          </span>
          <span>·</span>
          <span>{product.inStock ? "In stock" : "Back in 2 weeks"}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-lg">{formatINR(product.price)}</span>
          {product.fitsSelectedBike ? <Badge tone="success">✓ Fits your bike</Badge> : null}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------- Destination ------------------------------- */

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link to="/travel" className={cn(cardBase, "block")} aria-label={`Explore ${destination.name}`}>
      <Media src={destination.image} alt={`${destination.name}, ${destination.region}`} ratio="3/4" imgClassName="group-hover:scale-[1.05]">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h3 className="text-2xl">{destination.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{destination.descriptor}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge>{destination.days} days</Badge>
            <Badge>{destination.difficulty}</Badge>
            <Badge tone="primary">From {formatINR(destination.startingPrice)}</Badge>
          </div>
        </div>
      </Media>
    </Link>
  );
}

/* ----------------------------------- Trip ---------------------------------- */

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <article className={cardBase}>
      <Media src={trip.image} alt={trip.name} ratio="16/10" imgClassName="group-hover:scale-[1.04]">
        <span className="absolute left-4 top-4">
          <Badge tone={trip.seatsLeft <= 5 ? "warning" : "neutral"}>{trip.seatsLeft} seats left</Badge>
        </span>
      </Media>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-primary">{trip.dates}</p>
        <h3 className="mt-2 text-xl leading-tight">{trip.name}</h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div>
            <dt className="uppercase tracking-[0.16em] text-[0.6rem]">Duration</dt>
            <dd className="text-foreground">{trip.days} days</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.16em] text-[0.6rem]">Distance</dt>
            <dd className="text-foreground">{trip.distanceKm.toLocaleString("en-IN")} km</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.16em] text-[0.6rem]">Starts</dt>
            <dd className="text-foreground">{trip.start}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-[0.16em] text-[0.6rem]">Grade</dt>
            <dd className="text-foreground">{trip.difficulty}</dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="font-display text-lg">{formatINR(trip.price)}</span>
          <Link to="/travel" className="font-display text-xs uppercase tracking-[0.18em] text-primary hover:underline">
            View trip
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ----------------------------------- Ride ---------------------------------- */

export function RideCard({ ride }: { ride: Ride }) {
  return (
    <article className="group flex flex-col gap-3 rounded-sm border border-border bg-card p-5 transition-colors hover:border-primary/60">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="primary">{ride.type}</Badge>
        <span className="text-xs text-muted-foreground">{ride.location}</span>
      </div>
      <h3 className="text-xl leading-tight">{ride.name}</h3>
      <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-2 text-xs text-muted-foreground">
        <li>{ride.distanceKm} km</li>
        <li>{ride.duration}</li>
        <li>{ride.difficulty}</li>
        <li>{ride.riders} riders</li>
      </ul>
    </article>
  );
}

/* ---------------------------------- Rider ---------------------------------- */

export function RiderCard({ rider }: { rider: Rider }) {
  const initials = rider.name
    .split(" ")
    .map((n) => n[0])
    .join("");
  return (
    <article className="flex items-center gap-4 rounded-sm border border-border bg-card p-4">
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm"
      >
        {initials}
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-base normal-case font-sans font-semibold">{rider.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {rider.bike} · {rider.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rider.kmThisYear.toLocaleString("en-IN")} km this year · {rider.ridesLed} rides led
        </p>
      </div>
    </article>
  );
}

/* ---------------------------------- Story ---------------------------------- */

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link to="/stories" className={cn(cardBase, "block")} aria-label={story.title}>
      <Media src={story.image} alt={story.title} ratio="16/10" imgClassName="group-hover:scale-[1.04]" />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          {story.destination} · {story.readMinutes} min read
        </p>
        <h3 className="mt-2 text-xl leading-tight">{story.title}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{story.excerpt}</p>
        <p className="mt-4 text-xs text-muted-foreground">By {story.rider}</p>
      </div>
    </Link>
  );
}
