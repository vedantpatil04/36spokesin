import { Link } from "@tanstack/react-router";
import { Badge, Media } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Destination } from "@/types";
import { cardBase } from "./card-styles";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      to="/travel/$destination"
      params={{ destination: destination.slug }}
      className={cn(cardBase, "block")}
      aria-label={`Explore ${destination.name}`}
    >
      <Media
        asset={destination.image}
        alt={`${destination.name}, ${destination.region}`}
        ratio="3/4"
        imgClassName="group-hover:scale-[1.05]"
      >
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
