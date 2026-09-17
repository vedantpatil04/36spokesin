import type { Rider } from "@/types";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

export function RiderCard({ rider }: { rider: Rider }) {
  return (
    <article className="flex items-center gap-4 rounded-sm border border-border bg-card p-4">
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm"
      >
        {initialsOf(rider.name)}
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-base normal-case font-sans font-semibold">{rider.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {rider.bike} <span aria-hidden>·</span> {rider.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rider.kmThisYear.toLocaleString("en-IN")} km this year <span aria-hidden>·</span>{" "}
          {rider.ridesLed} rides led
        </p>
      </div>
    </article>
  );
}
