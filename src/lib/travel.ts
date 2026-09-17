import type { Departure, Trip } from "@/types";

/** The first departure still taking riders, else the first listed. */
export function nextDeparture(trip: Trip): Departure | undefined {
  return trip.departures.find((departure) => departure.status !== "closed") ?? trip.departures[0];
}
