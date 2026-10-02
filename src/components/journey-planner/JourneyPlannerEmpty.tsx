import type { ComponentType } from "react";
import { CloudSun, Fuel, ListChecks, LoaderCircle, MapPin, Route } from "lucide-react";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const planContents: [IconType, string][] = [
  [Route, "The road route, its distance and riding time"],
  [ListChecks, "Riding days with a start time"],
  [MapPin, "Real towns, fuel and viewpoints on the way"],
  [CloudSun, "The forecast along the route"],
  [Fuel, "Fuel needed, when your mileage is known"],
];

export function JourneyPlannerEmpty({ isPlanning }: { isPlanning: boolean }) {
  return (
    <div
      aria-busy={isPlanning}
      className="flex h-full flex-col rounded-sm border border-dashed border-border-strong bg-card/40 p-6 md:p-8"
    >
      <h3 className="text-xl md:text-2xl">
        {isPlanning ? "Planning your journey" : "Your plan appears here"}
      </h3>
      {isPlanning ? (
        <p className="mt-3 flex max-w-md items-start gap-2.5 text-sm leading-relaxed text-foreground">
          <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-hidden />
          Looking up the road route, the forecast and places on the way, then laying out the days.
          This can take up to a minute.
        </p>
      ) : (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Enter where you start, where you're going, the date and how many are riding. The plan
          covers:
        </p>
      )}
      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {planContents.map(([Icon, label]) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-sm border border-border bg-background/40 px-3.5 py-3 text-sm text-foreground/90"
          >
            <Icon className="size-4 shrink-0 text-primary" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
