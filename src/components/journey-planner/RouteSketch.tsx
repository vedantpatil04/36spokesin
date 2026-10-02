import { ExternalLink } from "lucide-react";
import { formatDistance, projectRoute } from "@/lib/journey-planner";
import type { JourneyPlan, JourneyStopKind } from "@/types";

const WIDTH = 640;
const HEIGHT = 340;
const PADDING = 44;

const STOP_FILL: Record<JourneyStopKind, string> = {
  town: "fill-foreground",
  fuel: "fill-warning",
  food: "fill-success",
  viewpoint: "fill-primary",
};

const STOP_LABEL: Record<JourneyStopKind, string> = {
  town: "Town",
  fuel: "Fuel",
  food: "Food",
  viewpoint: "Viewpoint",
};

/** Keeps a label inside the drawing: anchored towards the middle from either edge. */
const anchorFor = (x: number) => (x > WIDTH * 0.6 ? "end" : "start");

/**
 * The route drawn from the routing service's own road geometry, with the plan's
 * stops placed at their real coordinates. A shape to read the journey by, not a
 * map to navigate with: the link opens the same two points in OpenStreetMap.
 */
export function RouteSketch({ plan }: { plan: JourneyPlan }) {
  const projection = projectRoute(plan.route.geometry, WIDTH, HEIGHT, PADDING);
  if (!projection) {
    return (
      <p className="rounded-sm border border-border bg-background/40 px-4 py-3 text-sm text-muted-foreground">
        The route's shape is unavailable for this plan.
      </p>
    );
  }

  const start = projection.point(plan.origin.lat, plan.origin.lon);
  const end = projection.point(plan.destination.lat, plan.destination.lon);
  const stops = plan.days.flatMap((day) => day.stops);
  const kinds = [...new Set(stops.map((stop) => stop.kind))];
  const directions = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${plan.origin.lat}%2C${plan.origin.lon}%3B${plan.destination.lat}%2C${plan.destination.lon}`;

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Route from ${plan.origin.name} to ${plan.destination.name}, ${formatDistance(plan.distanceKm)}${stops.length > 0 ? `, with ${stops.length} suggested stops` : ""}.`}
        className="block h-auto w-full rounded-sm border border-border bg-background/60"
      >
        <path
          d={projection.path}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary/15"
        />
        <path
          d={projection.path}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-primary"
        />

        {stops.map((stop) => {
          const { x, y } = projection.point(stop.lat, stop.lon);
          return (
            <circle
              key={`${stop.name}-${stop.kmFromStart}`}
              cx={x}
              cy={y}
              r={4.5}
              strokeWidth={2}
              className={`${STOP_FILL[stop.kind]} stroke-background`}
            >
              <title>{`${stop.name} (${STOP_LABEL[stop.kind].toLowerCase()}), km ${Math.round(stop.kmFromStart)}`}</title>
            </circle>
          );
        })}

        <circle
          cx={start.x}
          cy={start.y}
          r={7}
          strokeWidth={3}
          className="fill-background stroke-primary"
        />
        <circle
          cx={end.x}
          cy={end.y}
          r={7}
          strokeWidth={3}
          className="fill-primary stroke-background"
        />
        <text
          x={start.x + (anchorFor(start.x) === "end" ? -13 : 13)}
          y={start.y - 12}
          textAnchor={anchorFor(start.x)}
          className="fill-foreground font-display text-[15px] uppercase tracking-[0.08em]"
        >
          {plan.origin.name}
        </text>
        <text
          x={end.x + (anchorFor(end.x) === "end" ? -13 : 13)}
          y={end.y + 24}
          textAnchor={anchorFor(end.x)}
          className="fill-foreground font-display text-[15px] uppercase tracking-[0.08em]"
        >
          {plan.destination.name}
        </text>
      </svg>

      <figcaption className="mt-2.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full border-2 border-primary" />
            Start
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full bg-primary" />
            Destination
          </li>
          {kinds.map((kind) => (
            <li key={kind} className="flex items-center gap-1.5">
              <svg aria-hidden viewBox="0 0 10 10" className="size-2.5">
                <circle cx={5} cy={5} r={5} className={STOP_FILL[kind]} />
              </svg>
              {STOP_LABEL[kind]} stop
            </li>
          ))}
        </ul>
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Open in OpenStreetMap
          <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}
