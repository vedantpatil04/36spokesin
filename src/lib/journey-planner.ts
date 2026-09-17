/**
 * Plan Your Journey: lightweight helpers the form needs on first render
 * (route lookup, validation, formatting). The plan generator itself lives in
 * ./mock-travel-plan.ts and is loaded on demand when a plan is requested.
 */

import { bikes } from "@/data/bikes";
import { journeyRoutes } from "@/data/journey-planner";
import type { JourneyRoute, TravelPlanRequest } from "@/types";
import { daysBetween, parseISODate } from "@/lib/dates";

export type PlanRequestError = {
  field: "routeId" | "bikeId" | "startDate" | "endDate";
  message: string;
};

export const MAX_TRIP_DAYS = 21;

export function routesFrom(startingPoint: string): JourneyRoute[] {
  return journeyRoutes.filter((route) => route.from === startingPoint);
}

/** Field-level validation so the form can show messages next to each input. */
export function validatePlanRequest(request: TravelPlanRequest): PlanRequestError[] {
  const errors: PlanRequestError[] = [];
  if (!journeyRoutes.some((route) => route.id === request.routeId)) {
    errors.push({ field: "routeId", message: "Choose a destination." });
  }
  if (!bikes.some((bike) => bike.id === request.bikeId)) {
    errors.push({ field: "bikeId", message: "Choose the motorcycle you'll ride." });
  }
  const start = parseISODate(request.startDate);
  const end = parseISODate(request.endDate);
  if (!start) errors.push({ field: "startDate", message: "Add the day you set off." });
  if (!end) errors.push({ field: "endDate", message: "Add the day you want to arrive by." });
  if (start && end) {
    const span = daysBetween(start, end);
    if (span < 0)
      errors.push({ field: "endDate", message: "The end date is before the start date." });
    else if (span + 1 > MAX_TRIP_DAYS)
      errors.push({ field: "endDate", message: `Pick a trip of ${MAX_TRIP_DAYS} days or fewer.` });
  }
  return errors;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
