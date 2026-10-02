import { Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { RiderSpotlight } from "@/types";

/** A featured rider: photo, the bike, where they ride from and their favourite road. */
export function RiderSpotlightCard({
  rider,
  className,
}: {
  rider: RiderSpotlight;
  className?: string;
}) {
  const facts = [
    { label: "Rides", value: rider.bike },
    { label: "From", value: rider.location },
    { label: "Favourite ride", value: rider.favouriteRide },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card",
        className,
      )}
    >
      <Media asset={rider.image} alt={rider.hasImage ? rider.image.alt : ""} ratio="4/5" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl leading-tight">{rider.name}</h3>
        {facts.length > 0 ? (
          <dl className="mt-3 space-y-1.5 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">{fact.label}</dt>
                <dd className="min-w-0 text-foreground">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {rider.shortStory ? (
          <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            {rider.shortStory}
          </p>
        ) : null}
      </div>
    </article>
  );
}
