/**
 * Journey planning and saved journeys from the 36 Spokes API.
 *
 * Planning is public. The API gathers the route, weather and places from real
 * data sources, has an AI lay out the days from them, and returns the plan with
 * a token; saving sends both back unchanged, so a saved journey is exactly the
 * plan the rider saw. Saved-journey calls need the rider's token (browser only).
 */

import { getApiClient } from "@/lib/api";
import type {
  ID,
  JourneyPlanInput,
  PlannedJourney,
  SavedJourney,
  SavedJourneySummary,
} from "@/types";
import { orNull } from "./request-helpers";

export async function planJourney(
  input: JourneyPlanInput,
  signal?: AbortSignal,
): Promise<PlannedJourney> {
  const { bikeId, ...rest } = input;
  return getApiClient().request<PlannedJourney>("/journeys/plan", {
    method: "POST",
    auth: false,
    body: { ...rest, ...(bikeId ? { bikeModelId: bikeId } : {}) },
    ...(signal ? { signal } : {}),
  });
}

export async function saveJourney(planned: PlannedJourney): Promise<SavedJourneySummary> {
  return getApiClient().request<SavedJourneySummary>("/my-journeys", {
    method: "POST",
    body: planned,
  });
}

export async function listMyJourneys(): Promise<SavedJourneySummary[]> {
  return getApiClient().request<SavedJourneySummary[]>("/my-journeys");
}

/** The journey as it was saved. The API reads it from the database; nothing is planned again. */
export async function getMyJourney(id: ID): Promise<SavedJourney | null> {
  return orNull(getApiClient().request<SavedJourney>(`/my-journeys/${encodeURIComponent(id)}`));
}

export async function deleteMyJourney(id: ID): Promise<void> {
  await getApiClient().request<void>(`/my-journeys/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
