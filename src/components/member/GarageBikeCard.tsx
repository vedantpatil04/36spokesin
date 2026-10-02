import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Badge, Media } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import type { GarageBike } from "@/types";

/** A bike in the rider's own garage: model, variant, year and odometer. */
export function GarageBikeCard({
  garageBike,
  linkToDetails = false,
  headingLevel = "h2",
  actions,
}: {
  garageBike: GarageBike;
  linkToDetails?: boolean;
  headingLevel?: "h2" | "h3";
  actions?: ReactNode;
}) {
  const { bike } = garageBike;
  const name = `${bike.brand} ${bike.model}`;
  const Heading = headingLevel;
  const facts = [
    garageBike.variantName,
    garageBike.year ? String(garageBike.year) : null,
    garageBike.odometerKm !== null ? `${formatNumber(garageBike.odometerKm)} km` : null,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-border bg-card">
      <Media asset={bike.image} alt={name} ratio="16/9" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow">{garageBike.nickname ?? "My bike"}</p>
          {garageBike.isPrimary ? <Badge tone="primary">Main bike</Badge> : null}
          {garageBike.archived ? <Badge tone="warning">No longer listed</Badge> : null}
        </div>
        <Heading className="mt-2 text-2xl">
          {linkToDetails && !garageBike.archived ? (
            <Link to="/garage/$bike" params={{ bike: bike.slug }} className="hover:text-primary">
              {name}
            </Link>
          ) : (
            name
          )}
        </Heading>
        {facts.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {facts.map((fact, index) => (
              <span key={fact}>
                {index > 0 ? <span aria-hidden> · </span> : null}
                {fact}
              </span>
            ))}
          </p>
        ) : null}
        {actions ? <div className="mt-auto flex flex-wrap gap-2 pt-5">{actions}</div> : null}
      </div>
    </article>
  );
}
