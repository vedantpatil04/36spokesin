import type { RoutePlace } from "../plan.types.js";
import { buildPlan } from "./build-plan.js";
import { estimateFuel } from "./fuel.js";
import { checkAgainstFacts, checkItinerary, parseItinerary } from "./itinerary-check.js";
import { buildItineraryRequest, factsForPrompt } from "./itinerary-prompt.js";
import type { ItineraryDraft, PlanFacts } from "./journey-plan.js";

const place = (id: string, kind: RoutePlace["kind"], kmFromStart: number): RoutePlace => ({
  id,
  name: `Place ${id}`,
  kind,
  lat: 15,
  lon: 74,
  kmFromStart,
  offRouteKm: 0.4,
});

function facts(overrides: Partial<PlanFacts> = {}): PlanFacts {
  return {
    origin: { name: "Belagavi", displayName: "Belagavi, Karnataka, India", lat: 15.85, lon: 74.5 },
    destination: { name: "Goa", displayName: "Goa, India", lat: 15.3, lon: 74.08 },
    travelDate: "2026-10-12",
    riders: 2,
    route: { distanceKm: 600, durationMinutes: 720 },
    placesAvailable: true,
    places: [
      place("fuel-1", "fuel", 90),
      place("town-1", "town", 150),
      place("town-2", "town", 310),
      place("viewpoint-1", "viewpoint", 420),
      place("fuel-2", "fuel", 500),
    ],
    weather: {
      available: true,
      points: [
        {
          label: "Belagavi",
          kmFromStart: 0,
          lat: 15.85,
          lon: 74.5,
          days: [
            {
              date: "2026-10-12",
              tempMaxC: 29,
              tempMinC: 20,
              rainChancePct: 30,
              windKph: 12,
              condition: "Partly cloudy",
            },
            {
              date: "2026-10-13",
              tempMaxC: 28,
              tempMinC: 20,
              rainChancePct: 60,
              windKph: 14,
              condition: "Rain",
            },
          ],
        },
        {
          label: "Goa",
          kmFromStart: 600,
          lat: 15.3,
          lon: 74.08,
          days: [
            {
              date: "2026-10-12",
              tempMaxC: 31,
              tempMinC: 24,
              rainChancePct: 40,
              windKph: 16,
              condition: "Overcast",
            },
            {
              date: "2026-10-13",
              tempMaxC: 30,
              tempMinC: 24,
              rainChancePct: 70,
              windKph: 18,
              condition: "Rain showers",
            },
          ],
        },
      ],
    },
    preferences: { ridingStyle: "balanced", dailyTargetKm: 300, maxDays: 2, budget: null },
    bike: { name: "Royal Enfield Himalayan 450", mileageKmpl: 30, tankLitres: 17, rangeKm: 510 },
    ...overrides,
  };
}

function draft(overrides: Partial<ItineraryDraft> = {}): ItineraryDraft {
  return {
    overview: "Two riding days with an overnight halt at Place town-2.",
    recommendedStart: "06:30",
    days: [
      {
        day: 1,
        endPlaceId: "town-2",
        stops: [
          { placeId: "fuel-1", reason: "Top up before the ghat.", minutes: 10 },
          { placeId: "town-1", reason: "Breakfast.", minutes: 40 },
        ],
        notes: ["Start early."],
      },
      {
        day: 2,
        endPlaceId: "destination",
        stops: [{ placeId: "viewpoint-1", reason: "Short rest.", minutes: null }],
        notes: [],
      },
    ],
    breakAdvice: "Stop every 90 minutes.",
    weatherSummary: "Rain is likely on day two.",
    ridingNotes: ["Carry rain gear."],
    ...overrides,
  };
}

describe("parseItinerary", () => {
  it("accepts a well-formed answer, with or without a code fence", () => {
    const json = JSON.stringify(draft());
    expect(parseItinerary(json)).toEqual({ ok: true, value: draft() });
    expect(parseItinerary("```json\n" + json + "\n```").ok).toBe(true);
  });

  it("lists every problem with a malformed answer", () => {
    expect(parseItinerary("Here is your plan!")).toEqual({
      ok: false,
      problems: ["The answer is not valid JSON"],
    });
    const bad = parseItinerary(
      JSON.stringify({
        ...draft(),
        recommendedStart: "7am",
        days: [{ day: "one", stops: "none" }],
      }),
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.problems).toEqual(
        expect.arrayContaining([
          'recommendedStart must be a 24-hour time such as "06:30"',
          "days[0].day must be an integer",
          "days[0].endPlaceId must be a non-empty string",
          "days[0].stops must be an array",
        ]),
      );
    }
  });
});

describe("checkAgainstFacts", () => {
  it("passes a plan that only uses supplied places in route order", () => {
    expect(checkAgainstFacts(draft(), facts())).toEqual([]);
  });

  it("rejects a place the data source never returned", () => {
    const invented = draft();
    invented.days[0]!.stops[0]!.placeId = "cafe-sunrise";
    expect(checkAgainstFacts(invented, facts())).toContain(
      'Day 1: stop "cafe-sunrise" is not in the supplied places',
    );
  });

  it("rejects days that don't end at a town, run backwards or skip the destination", () => {
    const notTown = draft();
    notTown.days[0]!.endPlaceId = "fuel-2";
    expect(checkAgainstFacts(notTown, facts())).toContain(
      'Day 1: a day must end at a place of kind "town", not "fuel"',
    );

    const open = draft();
    open.days[1]!.endPlaceId = "town-2";
    expect(checkAgainstFacts(open, facts()).join(" ")).toContain(
      'the last day must end at "destination"',
    );

    const outOfOrder = draft();
    outOfOrder.days[0]!.stops.reverse();
    expect(checkAgainstFacts(outOfOrder, facts())).toContain(
      "Day 1: stops must be in the order they are reached",
    );

    const wrongDay = draft();
    wrongDay.days[1]!.stops = [{ placeId: "fuel-1", reason: "Fuel.", minutes: null }];
    wrongDay.days[0]!.stops = [];
    expect(checkAgainstFacts(wrongDay, facts())).toContain(
      'Day 2: stop "fuel-1" is not between the day\'s start and end',
    );
  });

  it("enforces the day limit and silence about weather it wasn't given", () => {
    expect(
      checkAgainstFacts(draft(), facts({ preferences: { ...facts().preferences, maxDays: 1 } })),
    ).toContain("The plan uses 2 days; at most 1 are allowed");
    expect(
      checkAgainstFacts(draft(), facts({ weather: { available: false, reason: "out of range" } })),
    ).toContain("weatherSummary must be null because the weather is unavailable");
  });

  it("runs both steps as one check", () => {
    expect(checkItinerary(JSON.stringify(draft()), facts()).ok).toBe(true);
    expect(checkItinerary("{}", facts()).ok).toBe(false);
  });
});

describe("buildPlan", () => {
  const fuel = estimateFuel({
    distanceKm: 600,
    riderMileageKmpl: null,
    catalogueMileageKmpl: 30,
    tankLitres: 17,
    riderPricePerLitre: 105,
    configuredPricePerLitre: null,
  });
  const plan = buildPlan(facts(), draft(), {
    geometry: Array.from({ length: 1000 }, (_, i) => ({ lat: 15 + i / 1000, lon: 74 })),
    fuel,
    sources: {
      geocoding: "geocoder",
      routing: "router",
      weather: "weather",
      places: "places",
      itinerary: "Gemini (test-model)",
    },
    generatedAt: new Date("2026-10-02T08:00:00Z"),
  });

  it("takes every number from the facts, not from the AI", () => {
    expect(plan.distanceKm).toBe(600);
    expect(plan.estimatedRideMinutes).toBe(720);
    expect(
      plan.days.map((day) => [day.start, day.end, day.distanceKm, day.estimatedRideMinutes]),
    ).toEqual([
      ["Belagavi", "Place town-2", 310, 372],
      ["Place town-2", "Goa", 290, 348],
    ]);
    expect(plan.days.map((day) => day.date)).toEqual(["2026-10-12", "2026-10-13"]);
  });

  it("gives stops their real names and positions, and each day its forecast", () => {
    expect(plan.days[0]!.stops.map((stop) => [stop.name, stop.kind, stop.kmFromStart])).toEqual([
      ["Place fuel-1", "fuel", 90],
      ["Place town-1", "town", 150],
    ]);
    // Day 1 ends at km 310: 290 km from Goa's forecast point, 310 km from Belagavi's.
    expect(plan.days[0]!.weather).toMatchObject({ at: "Goa", date: "2026-10-12", tempMaxC: 31 });
    expect(plan.days[1]!.weather).toMatchObject({
      at: "Goa",
      date: "2026-10-13",
      rainChancePct: 70,
    });
  });

  it("thins the route geometry and records where each fact came from", () => {
    expect(plan.route.geometry.length).toBeLessThanOrEqual(240);
    expect(plan.route.geometry[0]).toEqual([15, 74]);
    expect(plan.sources.itinerary).toBe("Gemini (test-model)");
    expect(plan.generatedAt).toBe("2026-10-02T08:00:00.000Z");
  });

  it("leaves the weather out when there is none", () => {
    const noWeather = facts({
      weather: { available: false, reason: "Forecasts only reach 15 days ahead." },
    });
    const built = buildPlan(noWeather, draft({ weatherSummary: null }), {
      geometry: [],
      fuel,
      sources: { geocoding: "g", routing: "r", weather: null, places: "p", itinerary: "i" },
      generatedAt: new Date(),
    });
    expect(built.weather).toEqual({
      available: false,
      reason: "Forecasts only reach 15 days ahead.",
      summary: null,
      points: [],
    });
    expect(built.days.every((day) => day.weather === null)).toBe(true);
  });
});

describe("estimateFuel", () => {
  const base = {
    distanceKm: 186,
    riderMileageKmpl: null,
    catalogueMileageKmpl: null,
    tankLitres: null,
    riderPricePerLitre: null,
    configuredPricePerLitre: null,
  };

  it("invents nothing when the mileage is unknown", () => {
    expect(estimateFuel({ ...base, riderPricePerLitre: 105 })).toMatchObject({
      mileageKmpl: null,
      requiredLitres: null,
      estimatedCost: null,
      rangeKm: null,
    });
  });

  it("gives litres without a cost when only the mileage is known", () => {
    expect(estimateFuel({ ...base, catalogueMileageKmpl: 30, tankLitres: 17 })).toMatchObject({
      mileageKmpl: 30,
      mileageSource: "catalogue",
      requiredLitres: 6.2,
      rangeKm: 510,
      pricePerLitre: null,
      estimatedCost: null,
    });
  });

  it("prefers the rider's own figures and prices the fuel", () => {
    expect(
      estimateFuel({
        ...base,
        riderMileageKmpl: 25,
        catalogueMileageKmpl: 30,
        riderPricePerLitre: 104.5,
        configuredPricePerLitre: 100,
      }),
    ).toMatchObject({
      mileageKmpl: 25,
      mileageSource: "rider",
      requiredLitres: 7.4,
      pricePerLitre: 104.5,
      priceSource: "rider",
      estimatedCost: 773,
    });
    expect(
      estimateFuel({ ...base, catalogueMileageKmpl: 30, configuredPricePerLitre: 100 }).priceSource,
    ).toBe("configured");
  });
});

describe("the prompt", () => {
  it("gives the AI the verified data and tells it not to invent", () => {
    const request = buildItineraryRequest(facts());
    expect(request.system).toContain("VERIFIED travel data");
    expect(request.system).toContain("Do not invent factual information");
    const sent = JSON.parse(request.user.slice(request.user.indexOf("{"))) as Record<
      string,
      unknown
    >;
    expect(sent).toMatchObject({
      journey: { routeDistanceKm: 600, routeRidingMinutes: 720, riders: 2 },
      preferences: { dailyTargetKm: 300, maxDays: 2 },
      bike: { mileageKmpl: 30, rangeKm: 510 },
    });
    expect((sent["places"] as unknown[]).length).toBe(5);
  });

  it("says plainly what is unavailable", () => {
    const sent = factsForPrompt(
      facts({
        weather: { available: false, reason: "out of range" },
        bike: { name: null, mileageKmpl: null, tankLitres: null, rangeKm: null },
      }),
    );
    expect(sent["weather"]).toBe("unavailable");
    expect(sent["bike"]).toEqual({
      name: "not given",
      mileageKmpl: "unavailable",
      tankLitres: "unavailable",
      rangeKm: "unavailable",
    });
  });
});
