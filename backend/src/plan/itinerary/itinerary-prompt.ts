import type { AiRequest, JsonSchema } from "../ai/ai-provider.js";
import type { PlanFacts } from "./journey-plan.js";

/** The last day ends here; every other day ends at a town from the supplied places. */
export const DESTINATION_ID = "destination";

const SYSTEM = `You plan motorcycle journeys for riders in India from VERIFIED travel data.

Rules you must follow:
- Do not invent factual information. Use only the supplied route data, place data, weather data and rider information.
- Every stop and every overnight halt must be a place from the supplied "places" list, referred to by its exact "id". Never name a restaurant, fuel station, hotel, viewpoint, town or attraction that is not in that list.
- Do not state distances, riding times, temperatures, rain chances, fuel quantities or prices of your own. The application adds those from the data. You may refer to the supplied figures in your notes.
- When data is missing, say that it is unavailable. If "weather" is unavailable, set "weatherSummary" to null and do not describe the weather.
- Optimise for practical motorcycle riding: a sensible daily distance, realistic breaks, a useful order of stops, rider comfort and clarity. Not for the largest number of attractions, and not for dramatic language.
- Write plainly and briefly, as an experienced ride captain would brief the group. No hype.

How to build the plan:
- Split the route into days. A day should be close to "preferences.dailyTargetKm" and the plan must not use more than "preferences.maxDays" days. A route shorter than the daily target is one day.
- Each day except the last must end at a place of kind "town", further along the route than the previous day's end. The last day ends at "${DESTINATION_ID}".
- Within a day, list stops in the order they are reached (rising "kmFromStart"), strictly between the day's start and end. Choose a few useful ones: fuel when the bike's range calls for it, a break roughly every 60 to 90 minutes of riding, a meal stop in a town around midday, a viewpoint only if it is close to the road.
- If "placesAvailable" is false or the list is empty, return no stops and one day ending at "${DESTINATION_ID}".
- "recommendedStart" is a 24-hour time such as "06:30", chosen for daylight, traffic and the supplied weather.
- Answer with JSON only, in the required shape.`;

const text = (description: string): JsonSchema => ({ type: "string", description });

/** The shape both providers are told to answer in. Validated again on the server. */
export const ITINERARY_SCHEMA: JsonSchema = {
  type: "object",
  required: [
    "overview",
    "recommendedStart",
    "days",
    "breakAdvice",
    "weatherSummary",
    "ridingNotes",
  ],
  properties: {
    overview: text("Two or three plain sentences on how the journey is laid out."),
    recommendedStart: text('Departure time on day 1, 24-hour "HH:MM".'),
    days: {
      type: "array",
      items: {
        type: "object",
        required: ["day", "endPlaceId", "stops", "notes"],
        properties: {
          day: { type: "integer", description: "1 for the first day, then 2, 3, ..." },
          endPlaceId: text(
            `Id of the town where the day ends, or "${DESTINATION_ID}" on the last day.`,
          ),
          stops: {
            type: "array",
            items: {
              type: "object",
              required: ["placeId", "reason"],
              properties: {
                placeId: text("Exact id of a supplied place."),
                reason: text("One short sentence: why stop here."),
                minutes: {
                  type: "integer",
                  nullable: true,
                  description: "Suggested length of the stop.",
                },
              },
            },
          },
          notes: { type: "array", items: text("A short practical note for this day.") },
        },
      },
    },
    breakAdvice: text("One or two sentences on how often to stop on this route."),
    weatherSummary: {
      type: "string",
      nullable: true,
      description:
        "What the supplied forecast means for the ride, or null when weather is unavailable.",
    },
    ridingNotes: {
      type: "array",
      items: text("A short practical riding note for the whole journey."),
    },
  },
};

/** The facts as the AI receives them: compact, and with nothing it should not rely on. */
export function factsForPrompt(facts: PlanFacts): Record<string, unknown> {
  return {
    journey: {
      origin: facts.origin.displayName,
      destination: facts.destination.displayName,
      travelDate: facts.travelDate,
      riders: facts.riders,
      routeDistanceKm: facts.route.distanceKm,
      routeRidingMinutes: facts.route.durationMinutes,
    },
    preferences: {
      ridingStyle: facts.preferences.ridingStyle,
      dailyTargetKm: facts.preferences.dailyTargetKm,
      maxDays: facts.preferences.maxDays,
      budgetInr: facts.preferences.budget ?? "not given",
    },
    bike: {
      name: facts.bike.name ?? "not given",
      mileageKmpl: facts.bike.mileageKmpl ?? "unavailable",
      tankLitres: facts.bike.tankLitres ?? "unavailable",
      rangeKm: facts.bike.rangeKm ?? "unavailable",
    },
    placesAvailable: facts.placesAvailable,
    places: facts.places.map((place) => ({
      id: place.id,
      name: place.name,
      kind: place.kind,
      kmFromStart: place.kmFromStart,
      kmOffRoute: place.offRouteKm,
    })),
    weather: facts.weather.available
      ? facts.weather.points.map((point) => ({
          where: point.label,
          kmFromStart: point.kmFromStart,
          forecast: point.days,
        }))
      : "unavailable",
  };
}

export function buildItineraryRequest(facts: PlanFacts): AiRequest {
  return {
    system: SYSTEM,
    user: `Plan this journey from the verified data below.\n\n${JSON.stringify(factsForPrompt(facts))}`,
    schema: ITINERARY_SCHEMA,
  };
}
