import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  ArrowRight,
  BedDouble,
  CircleAlert,
  CloudSun,
  Fuel,
  IndianRupee,
  Info,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import type { TravelPlan, TravelPlanDay } from "@/types";
import { formatDuration } from "@/lib/journey-planner";
import { formatShortDate, parseISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

const formatTemperature = (value: number) =>
  value < 0 ? `\u2212${Math.abs(value)}` : String(value);

function RouteHeading({ from, to, className }: { from: string; to: string; className?: string }) {
  return (
    <>
      {from}
      <ArrowRight
        className={cn(
          "mx-2 inline-block size-[0.8em] -translate-y-[0.06em] text-primary",
          className,
        )}
        aria-hidden
      />
      <span className="sr-only">to </span>
      {to}
    </>
  );
}

function DetailBlock({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: IconType;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-sm border border-border bg-background/40 p-4", className)}>
      <h5 className="flex items-center gap-2 font-display text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="size-3.5 text-primary" aria-hidden />
        {title}
      </h5>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function PlanDay({ day }: { day: TravelPlanDay }) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h4 className="text-xl leading-tight md:text-2xl">
          <RouteHeading from={day.from} to={day.to} />
        </h4>
        <dl className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div>
            <dt className="sr-only">Distance</dt>
            <dd className="font-display text-xl">{day.distanceKm} km</dd>
          </div>
          <div>
            <dt className="sr-only">Riding time</dt>
            <dd className="text-sm text-muted-foreground">
              About {formatDuration(day.ridingMinutes)} riding
            </dd>
          </div>
          {day.elevationM !== undefined ? (
            <div>
              <dt className="sr-only">Overnight altitude</dt>
              <dd className="text-sm text-muted-foreground">
                Sleep at {day.elevationM.toLocaleString("en-IN")} m
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailBlock icon={BedDouble} title="Stay">
          {day.stay ? (
            <>
              <p className="text-sm text-foreground">{day.stay.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {day.stay.kind}, from {formatINR(day.stay.pricePerNight)} a night
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No overnight stay needed.</p>
          )}
        </DetailBlock>

        <DetailBlock icon={MapPin} title="Places to visit">
          <ul className="space-y-1.5 text-sm text-foreground">
            {day.places.map((place) => (
              <li key={place} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-primary"
                />
                {place}
              </li>
            ))}
          </ul>
        </DetailBlock>

        <DetailBlock icon={CloudSun} title="Weather">
          <p className="text-sm text-foreground">{day.weather.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTemperature(day.weather.minC)} to {formatTemperature(day.weather.maxC)} °C,
            seasonal average
          </p>
          {day.weather.note ? (
            <p className="mt-2 text-xs leading-relaxed text-warning">{day.weather.note}</p>
          ) : null}
        </DetailBlock>

        <DetailBlock icon={Fuel} title="Fuel">
          <p className="text-sm text-foreground">{day.fuel.stop}</p>
          {day.fuel.note ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{day.fuel.note}</p>
          ) : null}
        </DetailBlock>
      </div>

      <DetailBlock icon={IndianRupee} title="Estimated cost" className="mt-3">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Fuel", day.cost.fuel],
              ["Stay", day.cost.stay],
              ["Food", day.cost.food],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">{formatINR(value)}</dd>
            </div>
          ))}
          <div>
            <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
              Day total
            </dt>
            <dd className="mt-0.5 font-display text-lg leading-tight text-primary">
              {formatINR(day.cost.total)}
            </dd>
          </div>
        </dl>
      </DetailBlock>
    </div>
  );
}

export function JourneyPlannerResult({
  plan,
  isStale,
  isUpdating,
  containerRef,
  headingId,
  onMounted,
}: {
  plan: TravelPlan;
  isStale: boolean;
  isUpdating: boolean;
  containerRef?: Ref<HTMLElement>;
  headingId: string;
  /** Called once after this plan view mounts, so the parent can move focus to it. */
  onMounted?: () => void;
}) {
  const tabsId = useId();
  const onMountedRef = useRef(onMounted);
  useEffect(() => {
    onMountedRef.current?.();
  }, []);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = activeIndex < plan.days.length ? activeIndex : 0;

  // WAI-ARIA tabs pattern: arrow keys move between days, Home/End jump to the ends.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = plan.days.length - 1;
    const next =
      event.key === "ArrowRight"
        ? safeIndex === last
          ? 0
          : safeIndex + 1
        : event.key === "ArrowLeft"
          ? safeIndex === 0
            ? last
            : safeIndex - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  const summary: [string, string][] = [
    ["Distance", `${plan.totalKm.toLocaleString("en-IN")} km`],
    ["Riding days", String(plan.days.length)],
    ["Estimated cost", formatINR(plan.totalCost)],
    ["Range per tank", `About ${plan.tankRangeKm} km`],
  ];

  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      aria-busy={isUpdating}
      className={cn(
        "scroll-mt-24 rounded-sm border border-border bg-card shadow-card transition-opacity focus:outline-none",
        isUpdating && "opacity-60",
      )}
    >
      <header className="border-b border-border p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id={headingId} className="text-2xl leading-tight md:text-3xl">
              <RouteHeading from={plan.from} to={plan.to} />
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Via {plan.via}. {plan.style} plan on a {plan.bikeName}.
            </p>
          </div>
          <Badge tone="warning" className="shrink-0">
            Sample plan
          </Badge>
        </div>

        {isStale ? (
          <p className="mt-3 text-xs text-warning">
            You've changed the trip details. Generate the plan again to update it.
          </p>
        ) : null}

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

        <ol
          aria-label="Overnight stops"
          className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs"
        >
          {plan.overnights.map((name, index) => {
            const inActiveDay = index === safeIndex || index === safeIndex + 1;
            return (
              <li key={`${name}-${index}`} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden className="h-px w-4 bg-border-strong" /> : null}
                <span className={cn(inActiveDay ? "text-foreground" : "text-muted-foreground")}>
                  {name}
                </span>
              </li>
            );
          })}
        </ol>

        {plan.notices.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {plan.notices.map((notice) => {
              const Icon = notice.tone === "warning" ? CircleAlert : Info;
              return (
                <li
                  key={notice.message}
                  className={cn(
                    "flex gap-2.5 rounded-sm border px-3 py-2.5 text-xs leading-relaxed",
                    notice.tone === "warning"
                      ? "border-warning/40 bg-warning/5 text-foreground"
                      : "border-border bg-background/40 text-muted-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-px size-3.5 shrink-0",
                      notice.tone === "warning" ? "text-warning" : "text-primary",
                    )}
                    aria-hidden
                  />
                  <span>{notice.message}</span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{plan.styleTip}</p>
      </header>

      <div
        role="tablist"
        aria-label="Days"
        className="no-scrollbar flex w-full gap-1 overflow-x-auto border-b border-border px-2 md:px-3"
      >
        {plan.days.map((day, index) => {
          const date = parseISODate(day.date);
          const selected = index === safeIndex;
          return (
            <button
              key={day.day}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${tabsId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={handleTabKeyDown}
              className={cn(
                "flex shrink-0 cursor-pointer flex-col items-start gap-0.5 border-b-2 px-3 py-3 text-left transition-colors",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-display text-xs uppercase tracking-[0.16em]">
                Day {day.day}
              </span>
              <span className="text-[0.7rem] text-muted-foreground">
                {date ? formatShortDate(date) : day.date}
              </span>
            </button>
          );
        })}
      </div>
      {plan.days.map((day, index) => (
        <div
          key={day.day}
          role="tabpanel"
          id={`${tabsId}-panel-${index}`}
          aria-labelledby={`${tabsId}-tab-${index}`}
          hidden={index !== safeIndex}
          tabIndex={0}
          className="p-5 focus-visible:outline-offset-[-2px] md:p-6"
        >
          <PlanDay day={day} />
        </div>
      ))}

      <footer className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground md:px-6">
        Built from sample data. Distances and prices are estimates, weather is a seasonal average,
        and stays are examples rather than bookable listings.
      </footer>
    </section>
  );
}
