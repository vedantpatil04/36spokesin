import type { ComponentType, ReactNode, Ref } from "react";
import {
  ArrowRight,
  CloudSun,
  Coffee,
  Database,
  Fuel,
  ListChecks,
  MapPin,
  Mountain,
  Route as RouteIcon,
  Utensils,
} from "lucide-react";
import { formatLongDate, formatShortDate, parseISODate } from "@/lib/dates";
import { formatINR, pluralize } from "@/lib/format";
import {
  RIDING_STYLES,
  formatClockTime,
  formatDistance,
  formatDuration,
} from "@/lib/journey-planner";
import { cn } from "@/lib/utils";
import type { JourneyDailyWeather, JourneyDay, JourneyPlan, JourneyStopKind } from "@/types";
import { RouteSketch } from "./RouteSketch";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const NOT_ENOUGH = "Not enough information";

const STOP_ICON: Record<JourneyStopKind, IconType> = {
  town: MapPin,
  fuel: Fuel,
  food: Utensils,
  viewpoint: Mountain,
};

const STOP_KIND: Record<JourneyStopKind, string> = {
  town: "Town",
  fuel: "Fuel",
  food: "Food",
  viewpoint: "Viewpoint",
};

const displayDate = (iso: string, long = false) => {
  const date = parseISODate(iso);
  return date ? (long ? formatLongDate(date) : formatShortDate(date)) : iso;
};

const temperature = (value: number) => `${Math.round(value)}°`.replace("-", "−");

function RouteHeading({ from, to }: { from: string; to: string }) {
  return (
    <>
      {from}
      <ArrowRight
        className="mx-2 inline-block size-[0.8em] -translate-y-[0.06em] text-primary"
        aria-hidden
      />
      <span className="sr-only">to </span>
      {to}
    </>
  );
}

/** Says where a block's facts came from. Every factual block of the plan carries one. */
function Source({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-muted-foreground">
      <Database className="mt-[0.15rem] size-3 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: IconType;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-border p-5 md:p-6">
      <h4 className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {title}
      </h4>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

/** "Mainly clear · 23° to 33° · rain 25% · wind 14 km/h", leaving out what the provider didn't give. */
function forecastLine(weather: JourneyDailyWeather): string {
  const parts: string[] = [];
  if (weather.condition) parts.push(weather.condition);
  if (weather.tempMinC !== null && weather.tempMaxC !== null) {
    parts.push(`${temperature(weather.tempMinC)} to ${temperature(weather.tempMaxC)}C`);
  }
  if (weather.rainChancePct !== null) parts.push(`rain ${Math.round(weather.rainChancePct)}%`);
  if (weather.windKph !== null) parts.push(`wind ${Math.round(weather.windKph)} km/h`);
  return parts.length > 0 ? parts.join(" · ") : "No forecast for this day";
}

function DayCard({ day, single }: { day: JourneyDay; single: boolean }) {
  return (
    <li className="rounded-sm border border-border bg-background/40 p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
        <div>
          <p className="font-display text-[0.7rem] uppercase tracking-[0.18em] text-primary">
            {single ? displayDate(day.date) : `Day ${day.day} · ${displayDate(day.date)}`}
          </p>
          <h5 className="mt-1 text-lg leading-tight md:text-xl">
            <RouteHeading from={day.start} to={day.end} />
          </h5>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-display text-lg text-foreground">
            {formatDistance(day.distanceKm)}
          </span>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          about {formatDuration(day.estimatedRideMinutes)} riding
        </p>
      </div>

      {day.stops.length > 0 ? (
        <ol className="mt-4 space-y-3 border-l border-border-strong pl-4">
          {day.stops.map((stop) => {
            const Icon = STOP_ICON[stop.kind];
            return (
              <li key={`${stop.name}-${stop.kmFromStart}`} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.3rem] top-[0.4rem] size-2 rounded-full bg-primary"
                />
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-foreground">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{stop.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {STOP_KIND[stop.kind]} · km {Math.round(stop.kmFromStart)}
                    {stop.suggestedMinutes ? ` · ${formatDuration(stop.suggestedMinutes)}` : ""}
                  </span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stop.reason}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No stops suggested for this day.</p>
      )}

      {day.weather ? (
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <CloudSun className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="text-foreground">{day.weather.at}:</span> {forecastLine(day.weather)}
          </span>
        </p>
      ) : null}

      {day.notes.length > 0 ? (
        <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {day.notes.map((note) => (
            <li key={note} className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-primary" />
              {note}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function FuelBlock({ plan }: { plan: JourneyPlan }) {
  const { fuel } = plan;
  const rows: [string, string, string | null][] = [
    [
      "Mileage",
      fuel.mileageKmpl !== null ? `${fuel.mileageKmpl} km per litre` : NOT_ENOUGH,
      fuel.mileageSource === "rider"
        ? "As you entered it"
        : fuel.mileageSource === "catalogue"
          ? `Listed for the ${plan.bikeName ?? "motorcycle"} in the 36 Spokes catalogue`
          : "Add your motorcycle or its mileage",
    ],
    [
      "Fuel needed",
      fuel.requiredLitres !== null ? `About ${fuel.requiredLitres} litres` : NOT_ENOUGH,
      fuel.requiredLitres !== null ? "Route distance divided by mileage" : null,
    ],
    [
      "Range per tank",
      fuel.rangeKm !== null ? `About ${fuel.rangeKm} km` : NOT_ENOUGH,
      fuel.rangeKm !== null && fuel.tankLitres !== null
        ? `${fuel.tankLitres} litre tank at that mileage`
        : null,
    ],
    [
      "Fuel cost",
      fuel.estimatedCost !== null ? `About ${formatINR(fuel.estimatedCost)}` : NOT_ENOUGH,
      fuel.estimatedCost !== null && fuel.pricePerLitre !== null
        ? `At ${formatINR(fuel.pricePerLitre)} a litre, ${fuel.priceSource === "rider" ? "as you entered it" : "the price set by 36 Spokes"}`
        : fuel.requiredLitres !== null
          ? "Add a fuel price to estimate the cost"
          : null,
    ],
  ];

  return (
    <Block icon={Fuel} title="Fuel, per motorcycle">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map(([label, value, detail]) => (
          <div key={label}>
            <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </dt>
            <dd
              className={cn(
                "mt-1 text-sm",
                value === NOT_ENOUGH ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {value}
            </dd>
            {detail ? <dd className="mt-0.5 text-xs text-muted-foreground">{detail}</dd> : null}
          </div>
        ))}
      </dl>
      <Source>
        Worked out from the route distance and the figures above. Nothing is assumed: without a
        mileage or a price, no estimate is shown.
      </Source>
    </Block>
  );
}

function WeatherBlock({ plan }: { plan: JourneyPlan }) {
  const { weather } = plan;
  return (
    <Block icon={CloudSun} title="Weather on the route">
      {weather.available && weather.points.length > 0 ? (
        <>
          {weather.summary ? (
            <p className="text-sm leading-relaxed text-foreground">{weather.summary}</p>
          ) : null}
          <ul className={cn("space-y-3", weather.summary && "mt-4")}>
            {weather.points.map((point) => (
              <li key={`${point.label}-${point.kmFromStart}`}>
                <p className="text-sm text-foreground">
                  {point.label}
                  <span className="ml-2 text-xs text-muted-foreground">
                    km {Math.round(point.kmFromStart)}
                  </span>
                </p>
                {point.days.length > 0 ? (
                  <ul className="mt-1 space-y-0.5 text-xs leading-relaxed text-muted-foreground">
                    {point.days.map((day) => (
                      <li key={day.date}>
                        <span className="text-foreground/80">{displayDate(day.date)}:</span>{" "}
                        {forecastLine(day)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Forecast unavailable here.</p>
                )}
              </li>
            ))}
          </ul>
          <Source>
            Forecast figures from {plan.sources.weather ?? "the weather service"}
            {weather.summary ? `. The summary is written by ${plan.sources.itinerary}` : ""}.
            Forecasts change: check again before you ride.
          </Source>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="text-foreground">Weather unavailable.</span>{" "}
          {weather.reason ?? "The weather service didn't answer."}
        </p>
      )}
    </Block>
  );
}

/**
 * A journey plan as structured travel information: the route and its figures,
 * the days and stops, weather, fuel and notes, each with the source of its
 * facts. Used for a fresh plan and for a saved one, which is shown as stored.
 */
export function JourneyPlanResult({
  plan,
  headingId,
  containerRef,
  actions,
  className,
}: {
  plan: JourneyPlan;
  headingId: string;
  containerRef?: Ref<HTMLElement>;
  /** Shown under the summary, e.g. Save journey. */
  actions?: ReactNode;
  className?: string;
}) {
  const style = RIDING_STYLES.find((option) => option.id === plan.preferences.ridingStyle);
  const summary: [string, string][] = [
    ["Distance", formatDistance(plan.distanceKm)],
    ["Riding time", `About ${formatDuration(plan.estimatedRideMinutes)}`],
    ["Start by", formatClockTime(plan.recommendedStart)],
    ["Riding days", String(plan.days.length)],
  ];
  const matched =
    plan.origin.displayName !== plan.origin.name ||
    plan.destination.displayName !== plan.destination.name;

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-24 rounded-sm border border-border bg-card shadow-card focus:outline-none",
        className,
      )}
    >
      <header className="p-5 md:p-6">
        <h3 id={headingId} className="text-2xl leading-tight md:text-3xl">
          <RouteHeading from={plan.origin.name} to={plan.destination.name} />
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {displayDate(plan.travelDate, true)} · {pluralize(plan.riders, "rider")}
          {style ? ` · ${style.label} pace` : ""}
          {plan.bikeName ? ` · ${plan.bikeName}` : ""}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="bg-card px-3 py-3">
              <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 font-display text-lg leading-tight">{value}</dd>
            </div>
          ))}
        </dl>
        <Source>
          Distance and riding time from {plan.sources.routing}. Riding time is the routing service's
          estimate without stops or traffic. The start time is suggested by {plan.sources.itinerary}
          .
        </Source>

        {actions ? <div className="mt-5">{actions}</div> : null}
      </header>

      <Block icon={RouteIcon} title="Route">
        <RouteSketch plan={plan} />
        {matched ? (
          <dl className="mt-4 space-y-1.5 text-xs leading-relaxed">
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">From</dt>
              <dd className="text-foreground/90">{plan.origin.displayName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">To</dt>
              <dd className="text-foreground/90">{plan.destination.displayName}</dd>
            </div>
          </dl>
        ) : null}
        <Source>
          Road geometry from {plan.sources.routing}; places matched by {plan.sources.geocoding}. If
          a place isn't the one you meant, add its district or state and plan again.
        </Source>
      </Block>

      <Block icon={ListChecks} title={plan.days.length === 1 ? "The ride" : "Day by day"}>
        <p className="text-sm leading-relaxed text-foreground">{plan.overview}</p>
        <ol className="mt-4 space-y-3">
          {plan.days.map((day) => (
            <DayCard key={day.day} day={day} single={plan.days.length === 1} />
          ))}
        </ol>
        {plan.placesAvailable ? (
          <Source>
            Stops are real places from {plan.sources.places ?? "OpenStreetMap"}, chosen and ordered
            by {plan.sources.itinerary}. Day distances are measured along the route. Opening hours
            and fuel availability aren't known: confirm before relying on a stop.
          </Source>
        ) : (
          <Source>
            Place data was unavailable when this plan was made, so no stops or overnight halts are
            suggested. Plan again in a little while to include them.
          </Source>
        )}
      </Block>

      <WeatherBlock plan={plan} />
      <FuelBlock plan={plan} />

      <Block icon={Coffee} title="Breaks and riding notes">
        <p className="text-sm leading-relaxed text-foreground">{plan.breakAdvice}</p>
        {plan.ridingNotes.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-foreground/90">
            {plan.ridingNotes.map((note) => (
              <li key={note} className="flex gap-2.5">
                <span aria-hidden className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-primary" />
                {note}
              </li>
            ))}
          </ul>
        ) : null}
        {plan.preferences.budget !== null ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Budget you gave: {formatINR(plan.preferences.budget)}. Only fuel is costed here; stays
            and food aren't estimated.
          </p>
        ) : null}
        <Source>Advice written by {plan.sources.itinerary} from the data in this plan.</Source>
      </Block>

      <footer className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground md:px-6">
        Planned on{" "}
        {new Date(plan.generatedAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        . Map data © OpenStreetMap contributors. Check road and weather conditions yourself before
        you ride.
      </footer>
    </section>
  );
}
