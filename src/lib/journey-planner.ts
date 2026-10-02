/**
 * Plan Your Journey: what the planner UI needs besides the API call. Form
 * validation, wording for failures, keeping a plan across sign-in, and turning
 * the route's real geometry into an SVG path.
 */

import { ApiError } from "@/lib/api";
import { parseISODate } from "@/lib/dates";
import type { JourneyPlanInput, PlannedJourney, RidingStyle } from "@/types";

export const RIDING_STYLES: { id: RidingStyle; label: string; description: string }[] = [
  { id: "relaxed", label: "Relaxed", description: "About 200 km a day" },
  { id: "balanced", label: "Balanced", description: "About 300 km a day" },
  { id: "spirited", label: "Spirited", description: "About 400 km a day" },
];

/** Limits the API enforces; mirrored here so mistakes are caught before a request is spent. */
export const PLAN_LIMITS = {
  riders: { min: 1, max: 50 },
  mileageKmpl: { min: 5, max: 120 },
  fuelPricePerLitre: { min: 20, max: 500 },
  dailyDistanceKm: { min: 50, max: 800 },
  tripDays: { min: 1, max: 14 },
} as const;

export type PlanField = keyof JourneyPlanInput;
export type PlanFieldErrors = Partial<Record<PlanField, string>>;

/** The form's raw values: text as typed, so an empty box stays "not given". */
export type PlanFormValues = {
  origin: string;
  destination: string;
  date: string;
  riders: string;
  bikeId: string;
  mileageKmpl: string;
  fuelPricePerLitre: string;
  ridingStyle: RidingStyle | "";
  dailyDistanceKm: string;
  tripDays: string;
  budget: string;
};

const between = (value: number, { min, max }: { min: number; max: number }) =>
  value >= min && value <= max;

/** Turns the form into a request, or says what to fix next to each field. */
export function readPlanForm(
  values: PlanFormValues,
  today: string | undefined,
): { input: JourneyPlanInput; errors: null } | { input: null; errors: PlanFieldErrors } {
  const errors: PlanFieldErrors = {};
  const origin = values.origin.trim();
  const destination = values.destination.trim();
  if (origin.length < 2) errors.origin = "Enter where you're starting from.";
  if (destination.length < 2) errors.destination = "Enter where you're riding to.";
  if (!errors.origin && !errors.destination && origin.toLowerCase() === destination.toLowerCase()) {
    errors.destination = "The destination is the same as the start.";
  }

  if (!parseISODate(values.date)) errors.date = "Choose the day you set off.";
  else if (today && values.date < today) errors.date = "Choose today or a later date.";

  const riders = Number(values.riders);
  if (!Number.isInteger(riders) || !between(riders, PLAN_LIMITS.riders)) {
    errors.riders = `Enter a number of riders from ${PLAN_LIMITS.riders.min} to ${PLAN_LIMITS.riders.max}.`;
  }

  const optional = (
    field: "mileageKmpl" | "fuelPricePerLitre" | "dailyDistanceKm" | "tripDays",
    whole: boolean,
    unit: string,
  ): number | undefined => {
    const text = values[field].trim();
    if (!text) return undefined;
    const value = Number(text);
    const limits = PLAN_LIMITS[field];
    if (!Number.isFinite(value) || (whole && !Number.isInteger(value)) || !between(value, limits)) {
      errors[field] =
        `Enter ${whole ? "a whole number" : "a number"} from ${limits.min} to ${limits.max} ${unit}, or leave it empty.`;
      return undefined;
    }
    return value;
  };
  const mileageKmpl = optional("mileageKmpl", false, "km per litre");
  const fuelPricePerLitre = optional("fuelPricePerLitre", false, "rupees");
  const dailyDistanceKm = optional("dailyDistanceKm", true, "km");
  const tripDays = optional("tripDays", true, "days");

  let budget: number | undefined;
  if (values.budget.trim()) {
    budget = Number(values.budget);
    if (!Number.isInteger(budget) || budget < 0 || budget > 10_000_000) {
      errors.budget = "Enter a whole amount in rupees, or leave it empty.";
    }
  }

  if (Object.keys(errors).length > 0) return { input: null, errors };
  return {
    errors: null,
    input: {
      origin,
      destination,
      date: values.date,
      riders,
      ...(values.bikeId ? { bikeId: values.bikeId } : {}),
      ...(mileageKmpl !== undefined ? { mileageKmpl: Math.round(mileageKmpl * 10) / 10 } : {}),
      ...(fuelPricePerLitre !== undefined
        ? { fuelPricePerLitre: Math.round(fuelPricePerLitre * 100) / 100 }
        : {}),
      ...(values.ridingStyle ? { ridingStyle: values.ridingStyle } : {}),
      ...(dailyDistanceKm !== undefined ? { dailyDistanceKm } : {}),
      ...(tripDays !== undefined ? { tripDays } : {}),
      ...(budget !== undefined ? { budget } : {}),
    },
  };
}

export const PLANNING_UNAVAILABLE = "Travel planning is temporarily unavailable. Please try again.";

/** Failures the API explains in words meant for riders; anything else gets the generic line. */
const EXPLAINED = new Set([
  "LOCATION_NOT_FOUND",
  "ROUTE_NOT_FOUND",
  "JOURNEY_TOO_LONG",
  "ROUTE_UNAVAILABLE",
  "PLANNING_UNAVAILABLE",
  "SERVICE_UNAVAILABLE",
  "INVALID_REFERENCE",
]);

const API_FIELDS: Record<string, PlanField> = {
  origin: "origin",
  destination: "destination",
  date: "date",
  riders: "riders",
  bikeModelId: "bikeId",
  mileageKmpl: "mileageKmpl",
  fuelPricePerLitre: "fuelPricePerLitre",
  dailyDistanceKm: "dailyDistanceKm",
  tripDays: "tripDays",
  budget: "budget",
};

/**
 * What to tell the rider when planning fails. Never technical: a field message
 * when the API points at one, its own explanation for known failures, and
 * otherwise the same calm line.
 */
export function describePlanFailure(error: unknown): { message: string; fields: PlanFieldErrors } {
  if (!(error instanceof ApiError)) return { message: PLANNING_UNAVAILABLE, fields: {} };

  const fields: PlanFieldErrors = {};
  for (const detail of error.details) {
    const field = API_FIELDS[detail.field];
    const message = detail.messages[0];
    if (field && message) fields[field] = message.charAt(0).toUpperCase() + message.slice(1);
  }
  if (error.status === 429) {
    return {
      message: "You've planned several journeys in a short time. Wait a minute, then try again.",
      fields,
    };
  }
  if (error.code === "VALIDATION_FAILED") {
    return { message: "Check the highlighted details and try again.", fields };
  }
  return { message: EXPLAINED.has(error.code) ? error.message : PLANNING_UNAVAILABLE, fields };
}

// ─── Formatting ─────────────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** "06:30" → "6:30 AM". Anything else is shown as it came. */
export function formatClockTime(value: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return value;
  const hour = Number(match[1]);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

/** Whole kilometres above 100, one decimal below, so short hops don't read as "0 km". */
export function formatDistance(km: number): string {
  const value = km >= 100 ? Math.round(km) : Math.round(km * 10) / 10;
  return `${value.toLocaleString("en-IN")} km`;
}

// ─── Keeping a plan across sign-in and reloads ──────────────────────────────

const STORAGE_KEY = "36spokes:journey-plan";

export type RememberedPlan = {
  planned: PlannedJourney;
  values: PlanFormValues;
  /** The rider asked to save it and was sent to sign in first. */
  saveAfterSignIn: boolean;
};

/** Kept for this browser tab only (sessionStorage), so a sign-in round trip doesn't lose the plan. */
export function rememberPlan(entry: RememberedPlan | null): void {
  try {
    if (entry) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota). The plan still shows; it just isn't kept.
  }
}

export function recallPlan(): RememberedPlan | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<RememberedPlan>;
    const plan = entry.planned?.plan;
    if (
      !entry.values ||
      !entry.planned?.token ||
      plan?.version !== 1 ||
      !Array.isArray(plan.days)
    ) {
      return null;
    }
    return {
      planned: entry.planned,
      values: entry.values,
      saveAfterSignIn: entry.saveAfterSignIn === true,
    };
  } catch {
    return null;
  }
}

// ─── Route geometry → SVG ───────────────────────────────────────────────────

export type RouteProjection = {
  /** SVG path data for the road. */
  path: string;
  /** Places a coordinate on the same drawing. */
  point: (lat: number, lon: number) => { x: number; y: number };
};

/**
 * Fits a route into a box, keeping its true proportions: longitudes are scaled
 * by the cosine of the middle latitude, so a road that runs straight looks straight.
 * Null when there is too little geometry to draw.
 */
export function projectRoute(
  geometry: [number, number][],
  width: number,
  height: number,
  padding: number,
): RouteProjection | null {
  if (geometry.length < 2) return null;
  let south = Infinity;
  let north = -Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const [lat, lon] of geometry) {
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lon);
    east = Math.max(east, lon);
  }
  const lonScale = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const spanX = Math.max((east - west) * lonScale, 1e-6);
  const spanY = Math.max(north - south, 1e-6);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;

  const point = (lat: number, lon: number) => ({
    x: offsetX + (lon - west) * lonScale * scale,
    y: offsetY + (north - lat) * scale,
  });
  const path = geometry
    .map(([lat, lon], index) => {
      const { x, y } = point(lat, lon);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("");
  return { path, point };
}
