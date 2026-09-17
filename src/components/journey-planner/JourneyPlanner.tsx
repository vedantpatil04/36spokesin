import { lazy, Suspense, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui-kit";
import { bikes } from "@/data/bikes";
import { journeyStartingPoints, tripStyles } from "@/data/journey-planner";
import { routesFrom, validatePlanRequest, type PlanRequestError } from "@/lib/journey-planner";
import { requestTravelPlan } from "@/services/journey-planner";
import type { TravelPlan, TravelPlanRequest, TripStyle } from "@/types";
import { addDays, toISODate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { JourneyPlannerEmpty } from "./JourneyPlannerEmpty";

// The plan view is only needed after "Generate my plan", so it loads on demand
// instead of shipping with the homepage. The planning service lazy-loads its
// generator the same way.
const loadResult = () => import("./JourneyPlannerResult");
const JourneyPlannerResult = lazy(() =>
  loadResult().then((module) => ({ default: module.JourneyPlannerResult })),
);

const labelClass = "text-xs uppercase tracking-[0.18em] text-muted-foreground";
const controlClass =
  "mt-2 h-12 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground [color-scheme:dark] transition-colors hover:border-border-strong aria-[invalid=true]:border-destructive";

const sameRequest = (a: TravelPlanRequest, b: TravelPlanRequest) =>
  a.routeId === b.routeId &&
  a.bikeId === b.bikeId &&
  a.style === b.style &&
  a.startDate === b.startDate &&
  a.endDate === b.endDate;

export function JourneyPlanner() {
  const uid = useId();
  const ids = {
    start: `${uid}-start`,
    routeId: `${uid}-destination`,
    startDate: `${uid}-from-date`,
    endDate: `${uid}-to-date`,
    bikeId: `${uid}-bike`,
    style: `${uid}-style`,
    result: `${uid}-result`,
  };

  const [startingPoint, setStartingPoint] = useState(journeyStartingPoints[0] ?? "");
  const destinations = routesFrom(startingPoint);
  const [routeId, setRouteId] = useState(destinations[0]?.id ?? "");
  const [bikeId, setBikeId] = useState(bikes[0]?.id ?? "");
  const [style, setStyle] = useState<TripStyle>("Scenic");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [today, setToday] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<PlanRequestError[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [generation, setGeneration] = useState(0);

  const [loadError, setLoadError] = useState(false);
  /** Generation number of the result view that has actually mounted (it loads lazily). */
  const [mountedGeneration, setMountedGeneration] = useState(0);

  const resultRef = useRef<HTMLElement>(null);
  /** Increments per request so late responses from superseded requests are ignored. */
  const requestRef = useRef(0);

  // Default dates depend on the visitor's clock, so they are filled in after hydration.
  useEffect(() => {
    const now = new Date();
    const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const daysUntilSaturday = (6 - todayDate.getUTCDay() + 7) % 7 || 7;
    const saturday = addDays(todayDate, daysUntilSaturday);
    setToday(toISODate(todayDate));
    setStartDate((current) => current || toISODate(saturday));
    setEndDate((current) => current || toISODate(addDays(saturday, 1)));
    return () => {
      requestRef.current += 1;
    };
  }, []);

  // Bring the finished plan into view and move focus to it once its view has mounted.
  useEffect(() => {
    if (generation === 0 || isGenerating || mountedGeneration !== generation) return;
    const element = resultRef.current;
    if (!element) return;
    element.focus({ preventScroll: true });
    const { top } = element.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.35) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, [generation, isGenerating, mountedGeneration]);

  const request: TravelPlanRequest = { routeId, bikeId, style, startDate, endDate };
  const errorFor = (field: PlanRequestError["field"]) =>
    errors.find((error) => error.field === field)?.message;
  const clearError = (field: PlanRequestError["field"]) =>
    setErrors((current) => current.filter((error) => error.field !== field));

  const handleStartingPoint = (value: string) => {
    setStartingPoint(value);
    setRouteId(routesFrom(value)[0]?.id ?? "");
    clearError("routeId");
  };

  const handleStartDate = (value: string) => {
    setStartDate(value);
    clearError("startDate");
    if (value && endDate && endDate < value) setEndDate(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validatePlanRequest(request);
    setErrors(found);
    const firstError = found[0];
    if (firstError) {
      document.getElementById(ids[firstError.field])?.focus();
      return;
    }

    const submitted = { ...request };
    const requestNumber = ++requestRef.current;
    setIsGenerating(true);
    setLoadError(false);

    Promise.all([requestTravelPlan(submitted), loadResult()])
      .then(([nextPlan]) => {
        if (requestNumber !== requestRef.current) return;
        setPlan(nextPlan);
        setGeneration((count) => count + 1);
      })
      .catch(() => {
        if (requestNumber === requestRef.current) setLoadError(true);
      })
      .finally(() => {
        if (requestNumber === requestRef.current) setIsGenerating(false);
      });
  };

  const statusMessage = isGenerating
    ? "Planning your journey."
    : loadError
      ? "The planner didn't load. Check your connection and try again."
      : plan && generation > 0
        ? `Plan ready: ${plan.days.length} ${plan.days.length === 1 ? "day" : "days"}, ${plan.totalKm} km from ${plan.from} to ${plan.to}.`
        : "";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8">
      <form
        noValidate
        onSubmit={handleSubmit}
        aria-label="Plan your journey"
        className="rounded-sm border border-border bg-card p-5 shadow-card md:p-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={ids.start} className={labelClass}>
              Starting point
            </label>
            <select
              id={ids.start}
              value={startingPoint}
              onChange={(e) => handleStartingPoint(e.target.value)}
              className={controlClass}
            >
              {journeyStartingPoints.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={ids.routeId} className={labelClass}>
              Destination
            </label>
            <select
              id={ids.routeId}
              value={routeId}
              onChange={(e) => {
                setRouteId(e.target.value);
                clearError("routeId");
              }}
              aria-invalid={Boolean(errorFor("routeId"))}
              aria-describedby={errorFor("routeId") ? `${ids.routeId}-error` : undefined}
              className={controlClass}
            >
              {destinations.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.to}, via {route.via}
                </option>
              ))}
            </select>
            {errorFor("routeId") ? (
              <p id={`${ids.routeId}-error`} className="mt-1.5 text-xs text-destructive">
                {errorFor("routeId")}
              </p>
            ) : null}
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className={labelClass}>Travel dates</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={ids.startDate} className="text-xs text-muted-foreground">
                Set off
              </label>
              <input
                id={ids.startDate}
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => handleStartDate(e.target.value)}
                aria-invalid={Boolean(errorFor("startDate"))}
                aria-describedby={errorFor("startDate") ? `${ids.startDate}-error` : undefined}
                className={cn(controlClass, "mt-1.5")}
              />
              {errorFor("startDate") ? (
                <p id={`${ids.startDate}-error`} className="mt-1.5 text-xs text-destructive">
                  {errorFor("startDate")}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={ids.endDate} className="text-xs text-muted-foreground">
                Arrive by
              </label>
              <input
                id={ids.endDate}
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  clearError("endDate");
                }}
                aria-invalid={Boolean(errorFor("endDate"))}
                aria-describedby={errorFor("endDate") ? `${ids.endDate}-error` : undefined}
                className={cn(controlClass, "mt-1.5")}
              />
              {errorFor("endDate") ? (
                <p id={`${ids.endDate}-error`} className="mt-1.5 text-xs text-destructive">
                  {errorFor("endDate")}
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor={ids.bikeId} className={labelClass}>
            Bike
          </label>
          <select
            id={ids.bikeId}
            value={bikeId}
            onChange={(e) => {
              setBikeId(e.target.value);
              clearError("bikeId");
            }}
            className={controlClass}
          >
            {bikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.brand} {bike.model}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="mt-5">
          <legend className={labelClass}>Trip style</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tripStyles.map((option, index) => (
              <label
                key={option.id}
                className={cn(
                  "cursor-pointer",
                  index === tripStyles.length - 1 && "col-span-2 sm:col-span-1",
                )}
              >
                <input
                  type="radio"
                  name={ids.style}
                  value={option.id}
                  checked={style === option.id}
                  onChange={() => setStyle(option.id)}
                  className="peer sr-only"
                />
                <span className="flex h-full flex-col rounded-sm border border-border bg-background px-3 py-2.5 transition-colors hover:border-border-strong peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  <span className="font-display text-xs uppercase tracking-[0.14em] text-foreground">
                    {option.id}
                  </span>
                  <span className="mt-0.5 text-[0.7rem] leading-snug text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Planning
            </>
          ) : (
            "Generate my plan"
          )}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Preview with five sample routes, example stays and seasonal weather. The full planner will
          build plans with AI from live roads, forecasts and stays.
        </p>
      </form>

      <div className="min-w-0 lg:self-stretch">
        <p role="status" className="sr-only">
          {statusMessage}
        </p>
        {loadError ? (
          <p className="mb-3 rounded-sm border border-destructive/50 px-3 py-2.5 text-sm text-foreground">
            The planner didn't load. Check your connection and generate the plan again.
          </p>
        ) : null}
        {plan ? (
          <Suspense fallback={<JourneyPlannerEmpty isGenerating />}>
            <JourneyPlannerResult
              key={generation}
              plan={plan}
              isStale={!isGenerating && !sameRequest(plan.request, request)}
              isUpdating={isGenerating}
              containerRef={resultRef}
              headingId={ids.result}
              onMounted={() => setMountedGeneration(generation)}
            />
          </Suspense>
        ) : (
          <JourneyPlannerEmpty isGenerating={isGenerating} />
        )}
      </div>
    </div>
  );
}
