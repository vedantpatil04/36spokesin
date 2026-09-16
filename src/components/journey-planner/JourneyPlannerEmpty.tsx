import type { ComponentType } from "react";
import { BedDouble, CloudSun, Fuel, IndianRupee, LoaderCircle, MapPin, Route } from "lucide-react";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const planContents: [IconType, string][] = [
  [Route, "Kilometres and riding time"],
  [BedDouble, "Where to stay"],
  [MapPin, "Places to visit"],
  [CloudSun, "Weather to expect"],
  [Fuel, "Fuel stops for your bike"],
  [IndianRupee, "Estimated cost"],
];

export function JourneyPlannerEmpty({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div
      aria-busy={isGenerating}
      className="flex h-full flex-col rounded-sm border border-dashed border-border-strong bg-card/40 p-6 md:p-8"
    >
      <h3 className="text-xl md:text-2xl">Your plan appears here</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Choose your route, dates and bike, then generate a plan. Each riding day covers:
      </p>
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
      {isGenerating ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-foreground">
          <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
          Planning your journey
        </p>
      ) : null}
    </div>
  );
}
