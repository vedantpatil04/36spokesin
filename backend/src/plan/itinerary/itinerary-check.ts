import type { Checked } from "../ai/ai.service.js";
import { DESTINATION_ID } from "./itinerary-prompt.js";
import type { ItineraryDraft, PlanFacts } from "./journey-plan.js";

const MAX_STOPS_PER_DAY = 8;
const MAX_NOTES = 8;
const START_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Reads a string of sensible length, or records what is wrong with it. */
function readText(value: unknown, field: string, max: number, problems: string[]): string {
  if (typeof value !== "string" || value.trim() === "") {
    problems.push(`${field} must be a non-empty string`);
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > max) problems.push(`${field} must be at most ${max} characters`);
  return trimmed;
}

function readTextList(value: unknown, field: string, max: number, problems: string[]): string[] {
  if (!Array.isArray(value)) {
    problems.push(`${field} must be an array of strings`);
    return [];
  }
  if (value.length > MAX_NOTES) problems.push(`${field} must have at most ${MAX_NOTES} items`);
  return value.map((item, index) => readText(item, `${field}[${index}]`, max, problems));
}

/**
 * Step 1: does the AI's text have the required shape? Returns the draft, or
 * every problem found, so one retry can fix them all.
 */
export function parseItinerary(text: string): Checked<ItineraryDraft> {
  // Some models wrap JSON in a Markdown code fence despite being asked not to.
  const json = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, problems: ["The answer is not valid JSON"] };
  }
  if (!isRecord(raw)) return { ok: false, problems: ["The answer must be a JSON object"] };

  const problems: string[] = [];
  const overview = readText(raw["overview"], "overview", 900, problems);
  const recommendedStart = readText(raw["recommendedStart"], "recommendedStart", 5, problems);
  if (recommendedStart && !START_TIME.test(recommendedStart)) {
    problems.push('recommendedStart must be a 24-hour time such as "06:30"');
  }
  const breakAdvice = readText(raw["breakAdvice"], "breakAdvice", 500, problems);
  const ridingNotes = readTextList(raw["ridingNotes"], "ridingNotes", 300, problems);
  const weatherSummary =
    raw["weatherSummary"] === null || raw["weatherSummary"] === undefined
      ? null
      : readText(raw["weatherSummary"], "weatherSummary", 500, problems);

  const days: ItineraryDraft["days"] = [];
  if (!Array.isArray(raw["days"]) || raw["days"].length === 0) {
    problems.push("days must be a non-empty array");
  } else {
    raw["days"].forEach((value, index) => {
      const field = `days[${index}]`;
      if (!isRecord(value)) return void problems.push(`${field} must be an object`);
      if (!Number.isInteger(value["day"])) problems.push(`${field}.day must be an integer`);
      const endPlaceId = readText(value["endPlaceId"], `${field}.endPlaceId`, 60, problems);
      const stops: ItineraryDraft["days"][number]["stops"] = [];
      if (!Array.isArray(value["stops"])) {
        problems.push(`${field}.stops must be an array`);
      } else {
        if (value["stops"].length > MAX_STOPS_PER_DAY) {
          problems.push(`${field}.stops must have at most ${MAX_STOPS_PER_DAY} stops`);
        }
        value["stops"].forEach((stop, stopIndex) => {
          const stopField = `${field}.stops[${stopIndex}]`;
          if (!isRecord(stop)) return void problems.push(`${stopField} must be an object`);
          const minutes = stop["minutes"];
          if (
            minutes !== null &&
            minutes !== undefined &&
            (!Number.isInteger(minutes) || (minutes as number) < 1 || (minutes as number) > 480)
          ) {
            problems.push(`${stopField}.minutes must be a whole number of minutes or null`);
          }
          stops.push({
            placeId: readText(stop["placeId"], `${stopField}.placeId`, 60, problems),
            reason: readText(stop["reason"], `${stopField}.reason`, 300, problems),
            minutes: Number.isInteger(minutes) ? (minutes as number) : null,
          });
        });
      }
      days.push({
        day: Number.isInteger(value["day"]) ? (value["day"] as number) : index + 1,
        endPlaceId,
        stops,
        notes: readTextList(value["notes"], `${field}.notes`, 300, problems),
      });
    });
  }

  if (problems.length > 0) return { ok: false, problems };
  return {
    ok: true,
    value: { overview, recommendedStart, days, breakAdvice, weatherSummary, ridingNotes },
  };
}

/**
 * Step 2: does the draft agree with the facts? Every place must be one the
 * places source returned, in route order, and the plan must respect the limits.
 * This is what stops an invented stop from ever reaching a rider.
 */
export function checkAgainstFacts(draft: ItineraryDraft, facts: PlanFacts): string[] {
  const problems: string[] = [];
  const places = new Map(facts.places.map((place) => [place.id, place]));
  const totalKm = facts.route.distanceKm;

  if (draft.days.length > facts.preferences.maxDays) {
    problems.push(
      `The plan uses ${draft.days.length} days; at most ${facts.preferences.maxDays} are allowed`,
    );
  }
  if (!facts.weather.available && draft.weatherSummary !== null) {
    problems.push("weatherSummary must be null because the weather is unavailable");
  }

  const used = new Set<string>();
  let dayStartKm = 0;
  draft.days.forEach((day, index) => {
    const label = `Day ${index + 1}`;
    if (day.day !== index + 1) problems.push(`${label}: "day" must be ${index + 1}`);

    const isLast = index === draft.days.length - 1;
    let dayEndKm = totalKm;
    if (isLast) {
      if (day.endPlaceId !== DESTINATION_ID) {
        problems.push(`${label}: the last day must end at "${DESTINATION_ID}"`);
      }
    } else {
      const end = places.get(day.endPlaceId);
      if (!end) {
        problems.push(`${label}: endPlaceId "${day.endPlaceId}" is not in the supplied places`);
      } else if (end.kind !== "town") {
        problems.push(`${label}: a day must end at a place of kind "town", not "${end.kind}"`);
      } else if (end.kmFromStart <= dayStartKm) {
        problems.push(`${label}: its end must be further along the route than its start`);
      } else {
        dayEndKm = end.kmFromStart;
        if (used.has(end.id)) problems.push(`${label}: place "${end.id}" is used more than once`);
        used.add(end.id);
      }
    }

    let previousKm = dayStartKm;
    for (const stop of day.stops) {
      const place = places.get(stop.placeId);
      if (!place) {
        problems.push(`${label}: stop "${stop.placeId}" is not in the supplied places`);
        continue;
      }
      if (used.has(place.id)) problems.push(`${label}: place "${place.id}" is used more than once`);
      used.add(place.id);
      if (place.kmFromStart <= dayStartKm || place.kmFromStart >= dayEndKm) {
        problems.push(`${label}: stop "${place.id}" is not between the day's start and end`);
      } else if (place.kmFromStart < previousKm) {
        problems.push(`${label}: stops must be in the order they are reached`);
      }
      previousKm = Math.max(previousKm, place.kmFromStart);
    }
    dayStartKm = dayEndKm;
  });

  return problems;
}

/** Both steps, as the check the AI service runs on each answer. */
export function checkItinerary(text: string, facts: PlanFacts): Checked<ItineraryDraft> {
  const parsed = parseItinerary(text);
  if (!parsed.ok) return parsed;
  const problems = checkAgainstFacts(parsed.value, facts);
  return problems.length > 0 ? { ok: false, problems } : parsed;
}
