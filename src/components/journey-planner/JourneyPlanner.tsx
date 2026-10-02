import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { Button, fieldControlClasses, fieldLabelClasses } from "@/components/ui-kit";
import { addDays, toISODate } from "@/lib/dates";
import {
  PLAN_LIMITS,
  RIDING_STYLES,
  describePlanFailure,
  formatDistance,
  readPlanForm,
  recallPlan,
  rememberPlan,
  type PlanField,
  type PlanFieldErrors,
  type PlanFormValues,
} from "@/lib/journey-planner";
import { cn } from "@/lib/utils";
import { planJourney } from "@/services/journey-planner";
import type { Bike, PlannedJourney } from "@/types";
import { JourneyPlanResult } from "./JourneyPlanResult";
import { JourneyPlannerEmpty } from "./JourneyPlannerEmpty";
import { SaveJourney } from "./SaveJourney";

const EMPTY: PlanFormValues = {
  origin: "",
  destination: "",
  date: "",
  riders: "1",
  bikeId: "",
  mileageKmpl: "",
  fuelPricePerLitre: "",
  ridingStyle: "balanced",
  dailyDistanceKm: "",
  tripDays: "",
  budget: "",
};

/** The order fields appear in, so the first one with a problem gets the focus. */
const FIELD_ORDER: PlanField[] = [
  "origin",
  "destination",
  "date",
  "riders",
  "bikeId",
  "mileageKmpl",
  "fuelPricePerLitre",
  "dailyDistanceKm",
  "tripDays",
  "budget",
];
const OPTIONAL_FIELDS = new Set<PlanField>(FIELD_ORDER.slice(4));

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClasses}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClass = cn(fieldControlClasses, "aria-[invalid=true]:border-destructive");

/**
 * Plan Your Journey: four details in, a structured plan out. The plan is built
 * by the API from real route, weather and place data; this component only
 * collects the request, shows the result and offers to save it.
 */
export function JourneyPlanner({ bikes }: { bikes: Bike[] }) {
  const uid = useId();
  const id = (field: PlanField | "result" | "style" | "more") => `${uid}-${field}`;

  const [values, setValues] = useState<PlanFormValues>(EMPTY);
  const [today, setToday] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<PlanFieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [result, setResult] = useState<{ planned: PlannedJourney; values: PlanFormValues } | null>(
    null,
  );
  const [saveOnArrival, setSaveOnArrival] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  /** Counts finished plans, so the result is brought into view once per plan. */
  const [generation, setGeneration] = useState(0);

  const resultRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  // After hydration: today's date (the visitor's clock), and the plan this tab
  // already made, if any. That is how a plan survives the trip to sign in.
  useEffect(() => {
    const now = new Date();
    const todayDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    setToday(toISODate(todayDate));

    const remembered = recallPlan();
    if (remembered) {
      setValues(remembered.values);
      setResult({ planned: remembered.planned, values: remembered.values });
      setMoreOpen(
        FIELD_ORDER.some((field) => OPTIONAL_FIELDS.has(field) && remembered.values[field]),
      );
      if (remembered.saveAfterSignIn) {
        setSaveOnArrival(true);
        setGeneration((count) => count + 1);
        rememberPlan({ ...remembered, saveAfterSignIn: false });
      }
    } else {
      const daysUntilSaturday = (6 - todayDate.getUTCDay() + 7) % 7 || 7;
      setValues((current) =>
        current.date
          ? current
          : { ...current, date: toISODate(addDays(todayDate, daysUntilSaturday)) },
      );
    }
    return () => requestRef.current?.abort();
  }, []);

  // Bring a finished plan into view and move focus to it.
  useEffect(() => {
    if (generation === 0) return;
    const element = resultRef.current;
    if (!element) return;
    element.focus({ preventScroll: true });
    const { top } = element.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.35) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }, [generation]);

  const set = <K extends keyof PlanFormValues>(field: K, value: PlanFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const { [field as PlanField]: _cleared, ...rest } = current;
      return rest;
    });
  };

  const showErrors = (found: PlanFieldErrors) => {
    setErrors(found);
    const first = FIELD_ORDER.find((field) => found[field]);
    if (!first) return;
    if (OPTIONAL_FIELDS.has(first)) setMoreOpen(true);
    // Wait a frame so a field inside the just-opened section can take focus.
    requestAnimationFrame(() => document.getElementById(id(first))?.focus());
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const read = readPlanForm(values, today);
    if (read.errors) {
      showErrors(read.errors);
      return;
    }
    setErrors({});
    setFailure(null);
    setIsPlanning(true);

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const submitted = { ...values };

    planJourney(read.input, controller.signal)
      .then((planned) => {
        if (controller.signal.aborted) return;
        setResult({ planned, values: submitted });
        setSaveOnArrival(false);
        setGeneration((count) => count + 1);
        rememberPlan({ planned, values: submitted, saveAfterSignIn: false });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const described = describePlanFailure(error);
        setFailure(described.message);
        showErrors(described.fields);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsPlanning(false);
      });
  };

  const invalid = (field: PlanField) => ({
    "aria-invalid": errors[field] ? (true as const) : undefined,
    "aria-describedby": errors[field] ? `${id(field)}-error` : undefined,
  });

  const selectedBike = bikes.find((bike) => bike.id === values.bikeId);
  const bikeHint = !selectedBike
    ? "Used for the fuel estimate."
    : selectedBike.fuelEfficiencyKmpl !== null
      ? `The catalogue lists about ${selectedBike.fuelEfficiencyKmpl} km per litre${selectedBike.tankLitres !== null ? ` and a ${selectedBike.tankLitres} litre tank` : ""}.`
      : "The catalogue lists no mileage for this bike. Enter yours to estimate fuel.";

  const plan = result?.planned.plan;
  const isStale =
    result !== null && !isPlanning && JSON.stringify(result.values) !== JSON.stringify(values);
  const statusMessage = isPlanning
    ? "Planning your journey. This can take up to a minute."
    : failure
      ? failure
      : plan && generation > 0
        ? `Plan ready: ${plan.origin.name} to ${plan.destination.name}, ${formatDistance(plan.distanceKm)}, ${plan.days.length} ${plan.days.length === 1 ? "riding day" : "riding days"}.`
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
          <Field id={id("origin")} label="Start" error={errors.origin}>
            <input
              id={id("origin")}
              type="text"
              value={values.origin}
              onChange={(event) => set("origin", event.target.value)}
              placeholder="e.g. Belagavi"
              autoComplete="off"
              maxLength={120}
              className={controlClass}
              {...invalid("origin")}
            />
          </Field>
          <Field id={id("destination")} label="Destination" error={errors.destination}>
            <input
              id={id("destination")}
              type="text"
              value={values.destination}
              onChange={(event) => set("destination", event.target.value)}
              placeholder="e.g. Goa"
              autoComplete="off"
              maxLength={120}
              className={controlClass}
              {...invalid("destination")}
            />
          </Field>
          <Field id={id("date")} label="Date" error={errors.date}>
            <input
              id={id("date")}
              type="date"
              value={values.date}
              min={today}
              onChange={(event) => set("date", event.target.value)}
              className={controlClass}
              {...invalid("date")}
            />
          </Field>
          <Field id={id("riders")} label="Riders" error={errors.riders}>
            <input
              id={id("riders")}
              type="number"
              inputMode="numeric"
              min={PLAN_LIMITS.riders.min}
              max={PLAN_LIMITS.riders.max}
              step={1}
              value={values.riders}
              onChange={(event) => set("riders", event.target.value)}
              className={controlClass}
              {...invalid("riders")}
            />
          </Field>
        </div>

        <details
          open={moreOpen}
          onToggle={(event) => setMoreOpen(event.currentTarget.open)}
          className="group mt-5 border-t border-border pt-4"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-foreground [&::-webkit-details-marker]:hidden">
            <span>
              Motorcycle, pace and budget
              <span className="ml-2 text-xs text-muted-foreground">Optional</span>
            </span>
            <span
              aria-hidden
              className="font-display text-lg leading-none text-muted-foreground transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field
              id={id("bikeId")}
              label="Motorcycle"
              error={errors.bikeId}
              hint={bikeHint}
              className="sm:col-span-2"
            >
              <select
                id={id("bikeId")}
                value={values.bikeId}
                onChange={(event) => set("bikeId", event.target.value)}
                className={controlClass}
                {...invalid("bikeId")}
              >
                <option value="">Not specified</option>
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.brand} {bike.model}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id={id("mileageKmpl")}
              label="Your mileage"
              error={errors.mileageKmpl}
              hint="Km per litre. Overrides the catalogue's."
            >
              <input
                id={id("mileageKmpl")}
                type="number"
                inputMode="decimal"
                min={PLAN_LIMITS.mileageKmpl.min}
                max={PLAN_LIMITS.mileageKmpl.max}
                step={0.1}
                value={values.mileageKmpl}
                onChange={(event) => set("mileageKmpl", event.target.value)}
                className={controlClass}
                {...invalid("mileageKmpl")}
              />
            </Field>
            <Field
              id={id("fuelPricePerLitre")}
              label="Fuel price"
              error={errors.fuelPricePerLitre}
              hint="Rupees per litre, for the fuel cost."
            >
              <input
                id={id("fuelPricePerLitre")}
                type="number"
                inputMode="decimal"
                min={PLAN_LIMITS.fuelPricePerLitre.min}
                max={PLAN_LIMITS.fuelPricePerLitre.max}
                step={0.01}
                value={values.fuelPricePerLitre}
                onChange={(event) => set("fuelPricePerLitre", event.target.value)}
                className={controlClass}
                {...invalid("fuelPricePerLitre")}
              />
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className={fieldLabelClasses}>Riding style</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {RIDING_STYLES.map((option) => (
                  <label key={option.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name={id("style")}
                      value={option.id}
                      checked={values.ridingStyle === option.id}
                      onChange={() => set("ridingStyle", option.id)}
                      className="peer sr-only"
                    />
                    <span className="flex h-full flex-col rounded-sm border border-border bg-background px-3 py-2.5 transition-colors hover:border-border-strong peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                      <span className="font-display text-xs uppercase tracking-[0.14em] text-foreground">
                        {option.label}
                      </span>
                      <span className="mt-0.5 text-[0.7rem] leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field
              id={id("dailyDistanceKm")}
              label="Daily distance"
              error={errors.dailyDistanceKm}
              hint="Km a day. Overrides the riding style."
            >
              <input
                id={id("dailyDistanceKm")}
                type="number"
                inputMode="numeric"
                min={PLAN_LIMITS.dailyDistanceKm.min}
                max={PLAN_LIMITS.dailyDistanceKm.max}
                step={10}
                value={values.dailyDistanceKm}
                onChange={(event) => set("dailyDistanceKm", event.target.value)}
                className={controlClass}
                {...invalid("dailyDistanceKm")}
              />
            </Field>
            <Field
              id={id("tripDays")}
              label="Trip duration"
              error={errors.tripDays}
              hint="The most days the ride may take."
            >
              <input
                id={id("tripDays")}
                type="number"
                inputMode="numeric"
                min={PLAN_LIMITS.tripDays.min}
                max={PLAN_LIMITS.tripDays.max}
                step={1}
                value={values.tripDays}
                onChange={(event) => set("tripDays", event.target.value)}
                className={controlClass}
                {...invalid("tripDays")}
              />
            </Field>

            <Field
              id={id("budget")}
              label="Budget"
              error={errors.budget}
              hint="Rupees. Given to the planner as context; only fuel is costed."
              className="sm:col-span-2"
            >
              <input
                id={id("budget")}
                type="number"
                inputMode="numeric"
                min={0}
                step={500}
                value={values.budget}
                onChange={(event) => set("budget", event.target.value)}
                className={controlClass}
                {...invalid("budget")}
              />
            </Field>
          </div>
        </details>

        <Button type="submit" size="lg" className="mt-6 w-full" disabled={isPlanning}>
          {isPlanning ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Planning
            </>
          ) : (
            "Plan my journey"
          )}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Routes, distances, weather and stops come from live map and forecast data. An AI model
          arranges them into a plan and adds nothing of its own.
        </p>
      </form>

      <div className="min-w-0 lg:self-stretch">
        <p role="status" className="sr-only">
          {statusMessage}
        </p>
        {failure ? (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2.5 rounded-sm border border-destructive/50 px-3.5 py-3 text-sm text-foreground"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            {failure}
          </p>
        ) : null}
        {isPlanning && result ? (
          <p className="mb-3 flex items-start gap-2.5 rounded-sm border border-border px-3.5 py-3 text-sm text-foreground">
            <LoaderCircle
              className="mt-0.5 size-4 shrink-0 animate-spin text-primary"
              aria-hidden
            />
            Planning your journey. This can take up to a minute.
          </p>
        ) : null}
        {isStale ? (
          <p className="mb-3 rounded-sm border border-warning/40 bg-warning/5 px-3.5 py-2.5 text-xs text-foreground">
            You've changed the details. Plan again to update the plan below.
          </p>
        ) : null}
        {result && plan ? (
          <JourneyPlanResult
            key={result.planned.token}
            plan={plan}
            headingId={id("result")}
            containerRef={resultRef}
            className={cn("transition-opacity", isPlanning && "opacity-60")}
            actions={
              <SaveJourney
                planned={result.planned}
                saveOnArrival={saveOnArrival}
                onSignIn={() =>
                  rememberPlan({
                    planned: result.planned,
                    values: result.values,
                    saveAfterSignIn: true,
                  })
                }
                onSaved={() => setSaveOnArrival(false)}
              />
            }
          />
        ) : (
          <JourneyPlannerEmpty isPlanning={isPlanning} />
        )}
      </div>
    </div>
  );
}
