import type { LatLon } from "../plan.types.js";
import { round, thinLine } from "../support/geometry.js";
import { DESTINATION_ID } from "./itinerary-prompt.js";
import type {
  FuelEstimate,
  ItineraryDraft,
  JourneyPlan,
  PlanDay,
  PlanFacts,
} from "./journey-plan.js";

/** Enough points to draw the road's shape; small enough to store and send. */
const MAX_GEOMETRY_POINTS = 240;

const addDays = (isoDate: string, days: number): string => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export type PlanSources = JourneyPlan["sources"];

/**
 * Joins a validated draft with the facts into the plan riders see. Every number
 * here is either from a data source or arithmetic on one: a day's distance is
 * the gap between two points on the real route, and its riding time is that
 * share of the routing service's estimate. The draft contributes only the
 * choices (where days end, which stops) and the wording.
 */
export function buildPlan(
  facts: PlanFacts,
  draft: ItineraryDraft,
  extras: { geometry: LatLon[]; fuel: FuelEstimate; sources: PlanSources; generatedAt: Date },
): JourneyPlan {
  const places = new Map(facts.places.map((place) => [place.id, place]));
  const totalKm = facts.route.distanceKm;
  const weatherPoints = facts.weather.available ? facts.weather.points : [];

  let startKm = 0;
  let startName = facts.origin.name;
  const days: PlanDay[] = draft.days.map((day, index) => {
    const end = day.endPlaceId === DESTINATION_ID ? null : places.get(day.endPlaceId);
    const endKm = end ? end.kmFromStart : totalKm;
    const endName = end ? end.name : facts.destination.name;
    const distanceKm = endKm - startKm;
    const date = addDays(facts.travelDate, index);

    // The forecast point nearest to where the day ends, on that day's date.
    const nearest = [...weatherPoints].sort(
      (a, b) => Math.abs(a.kmFromStart - endKm) - Math.abs(b.kmFromStart - endKm),
    )[0];
    const forecast = nearest?.days.find((entry) => entry.date === date);

    const planDay: PlanDay = {
      day: index + 1,
      date,
      start: startName,
      end: endName,
      distanceKm: round(distanceKm),
      estimatedRideMinutes:
        totalKm > 0 ? Math.round((facts.route.durationMinutes * distanceKm) / totalKm) : 0,
      stops: day.stops.flatMap((stop) => {
        const place = places.get(stop.placeId);
        return place
          ? [
              {
                name: place.name,
                kind: place.kind,
                lat: place.lat,
                lon: place.lon,
                kmFromStart: place.kmFromStart,
                reason: stop.reason,
                suggestedMinutes: stop.minutes,
              },
            ]
          : [];
      }),
      weather: nearest && forecast ? { ...forecast, at: nearest.label } : null,
      notes: day.notes,
    };
    startKm = endKm;
    startName = endName;
    return planDay;
  });

  return {
    version: 1,
    origin: facts.origin,
    destination: facts.destination,
    travelDate: facts.travelDate,
    riders: facts.riders,
    distanceKm: round(totalKm),
    estimatedRideMinutes: facts.route.durationMinutes,
    recommendedStart: draft.recommendedStart,
    overview: draft.overview,
    days,
    breakAdvice: draft.breakAdvice,
    ridingNotes: draft.ridingNotes,
    weather: {
      available: facts.weather.available,
      reason: facts.weather.available ? null : facts.weather.reason,
      summary: facts.weather.available ? draft.weatherSummary : null,
      points: weatherPoints.map((point) => ({
        label: point.label,
        kmFromStart: round(point.kmFromStart),
        days: point.days,
      })),
    },
    fuel: extras.fuel,
    bikeName: facts.bike.name,
    preferences: {
      ridingStyle: facts.preferences.ridingStyle,
      dailyTargetKm: facts.preferences.dailyTargetKm,
      budget: facts.preferences.budget,
    },
    placesAvailable: facts.placesAvailable,
    route: {
      geometry: thinLine(extras.geometry, MAX_GEOMETRY_POINTS).map((point) => [
        round(point.lat, 5),
        round(point.lon, 5),
      ]),
    },
    sources: extras.sources,
    generatedAt: extras.generatedAt.toISOString(),
  };
}
