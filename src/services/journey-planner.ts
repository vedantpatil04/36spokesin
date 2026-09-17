/**
 * Journey planning service.
 *
 * Phase 2 resolves plans from the deterministic sample generator, loaded on
 * demand so it stays out of the homepage bundle. Phase 4 replaces the body with
 * a request to the real planner (routing, forecasts, stays, AI) returning the
 * same TravelPlan shape.
 */

import type { TravelPlan, TravelPlanRequest } from "@/types";

/** Short pause so the loading state is exercised before a real planner exists. */
const SAMPLE_LATENCY_MS = 600;

/** Resolves to null when the request doesn't describe a plannable trip. */
export async function requestTravelPlan(request: TravelPlanRequest): Promise<TravelPlan | null> {
  const pause = new Promise<void>((resolve) => setTimeout(resolve, SAMPLE_LATENCY_MS));
  const [generator] = await Promise.all([import("@/lib/mock-travel-plan"), pause]);
  return generator.generateMockTravelPlan(request);
}
