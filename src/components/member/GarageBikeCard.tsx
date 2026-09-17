import { Link } from "@tanstack/react-router";
import { Media } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import type { GarageBike } from "@/types";

/** A bike in the rider's own garage, with odometer and service status. */
export function GarageBikeCard({
  garageBike,
  linkToDetails = false,
}: {
  garageBike: GarageBike;
  linkToDetails?: boolean;
}) {
  const { bike } = garageBike;
  const name = `${bike.brand} ${bike.model}`;
  return (
    <article className="overflow-hidden rounded-sm border border-border bg-card">
      <Media asset={bike.image} alt={name} ratio="16/9" />
      <div className="p-5">
        <p className="eyebrow">My bike</p>
        <h2 className="mt-2 text-2xl">
          {linkToDetails ? (
            <Link to="/garage/$bike" params={{ bike: bike.slug }} className="hover:text-primary">
              {name}
            </Link>
          ) : (
            name
          )}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {bike.variant} <span aria-hidden>·</span> {formatNumber(garageBike.odometerKm)} km{" "}
          <span aria-hidden>·</span> Service due in {formatNumber(garageBike.serviceDueInKm)} km
        </p>
      </div>
    </article>
  );
}
