import { measureLine } from "../support/geometry.js";
import { Geocoder, pickResult } from "./geocoder.js";
import { PlaceFinder, selectCandidates } from "./places.js";
import { RouteFinder } from "./router.js";
import { WeatherForecaster, describeWeatherCode } from "./weather.js";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function fakeFetch(respond: (url: string, init: RequestInit) => Response) {
  const urls: string[] = [];
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    urls.push(String(url));
    return respond(String(url), init ?? {});
  }) as typeof fetch;
  return { fetchFn, urls };
}

describe("Geocoder", () => {
  const options = { baseUrl: "https://geo.test", userAgent: "test", countryCodes: "in" };

  it("resolves a place name, limits the search to the configured countries and caches it", async () => {
    const { fetchFn, urls } = fakeFetch(() =>
      json([{ lat: "15.3004543", lon: "74.0855134", name: "Goa", display_name: "Goa, India" }]),
    );
    const geocoder = new Geocoder({ ...options, fetchFn });
    const place = await geocoder.resolve("  Goa ");
    expect(place).toEqual({
      lat: 15.3004543,
      lon: 74.0855134,
      name: "Goa",
      displayName: "Goa, India",
    });
    expect(await geocoder.resolve("goa")).toEqual(place);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("https://geo.test/search?");
    expect(urls[0]).toContain("q=Goa");
    expect(urls[0]).toContain("countrycodes=in");
  });

  it("prefers the town over the district that shares its name", () => {
    const district = {
      lat: "16.15",
      lon: "74.88",
      name: "Belagavi",
      addresstype: "state_district",
    };
    const city = { lat: "15.85", lon: "74.50", name: "Belagavi", addresstype: "city" };
    const taluk = { lat: "16.30", lon: "74.74", name: "Belagavi", addresstype: "county" };
    expect(pickResult([district, city, taluk])).toBe(city);
    // A state stays a state, and a district with no town of that name stays the district.
    const state = { lat: "15.30", lon: "74.08", name: "Goa", addresstype: "state" };
    expect(pickResult([state, { ...city, name: "Goa Velha" }])).toBe(state);
    expect(pickResult([district, { ...city, name: "Gokak" }])).toBe(district);
    expect(pickResult([])).toBeUndefined();
  });

  it("returns null for a place the geocoder doesn't know", async () => {
    const { fetchFn } = fakeFetch(() => json([]));
    expect(await new Geocoder({ ...options, fetchFn }).resolve("Xyzzyville")).toBeNull();
  });
});

describe("RouteFinder", () => {
  const from = { lat: 15.85, lon: 74.5 };
  const to = { lat: 15.3, lon: 74.08 };

  it("returns the routing service's distance, time and geometry", async () => {
    const { fetchFn, urls } = fakeFetch(() =>
      json({
        code: "Ok",
        routes: [
          {
            distance: 186096.3,
            duration: 10532.8,
            geometry: {
              coordinates: [
                [74.5, 15.85],
                [74.08, 15.3],
              ],
            },
          },
        ],
      }),
    );
    const router = new RouteFinder({ baseUrl: "https://route.test", userAgent: "test", fetchFn });
    expect(await router.route(from, to)).toEqual({
      distanceKm: 186.1,
      durationMinutes: 176,
      geometry: [
        { lat: 15.85, lon: 74.5 },
        { lat: 15.3, lon: 74.08 },
      ],
    });
    await router.route(from, to);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain("/route/v1/driving/74.50000,15.85000;74.08000,15.30000?");
  });

  it("returns null when no road joins the two points", async () => {
    const { fetchFn } = fakeFetch(() =>
      json({ code: "NoRoute", message: "Impossible route" }, 400),
    );
    const router = new RouteFinder({ baseUrl: "https://route.test", userAgent: "test", fetchFn });
    expect(await router.route(from, to)).toBeNull();
  });
});

describe("WeatherForecaster", () => {
  const today = () => new Date("2026-10-02T08:00:00Z");
  const points = [
    { label: "Belagavi", kmFromStart: 0, lat: 15.85, lon: 74.5 },
    { label: "Goa", kmFromStart: 186, lat: 15.3, lon: 74.08 },
  ];
  const location = (max: number, code: number) => ({
    daily: {
      time: ["2026-10-12"],
      weather_code: [code],
      temperature_2m_max: [max],
      temperature_2m_min: [21],
      precipitation_probability_max: [35],
      wind_speed_10m_max: [14.2],
    },
  });

  it("maps the provider's daily forecast for each point", async () => {
    const { fetchFn, urls } = fakeFetch(() => json([location(29.4, 2), location(31, 61)]));
    const weather = new WeatherForecaster(
      { baseUrl: "https://wx.test", userAgent: "test", fetchFn },
      today,
    );
    const result = await weather.forecast(points, "2026-10-12", "2026-10-12");
    expect(result).toEqual({
      available: true,
      points: [
        {
          ...points[0],
          days: [
            {
              date: "2026-10-12",
              tempMaxC: 29.4,
              tempMinC: 21,
              rainChancePct: 35,
              windKph: 14.2,
              condition: "Partly cloudy",
            },
          ],
        },
        {
          ...points[1],
          days: [
            {
              date: "2026-10-12",
              tempMaxC: 31,
              tempMinC: 21,
              rainChancePct: 35,
              windKph: 14.2,
              condition: "Light rain",
            },
          ],
        },
      ],
    });
    expect(urls[0]).toContain("latitude=15.8500%2C15.3000");
  });

  it("says the weather is unavailable beyond the forecast range, without asking", async () => {
    const { fetchFn, urls } = fakeFetch(() => json([]));
    const weather = new WeatherForecaster(
      { baseUrl: "https://wx.test", userAgent: "test", fetchFn },
      today,
    );
    const result = await weather.forecast(points, "2026-12-12", "2026-12-12");
    expect(result.available).toBe(false);
    expect(urls).toHaveLength(0);
  });

  it("only asks for the days the forecast covers on a long trip", async () => {
    const { fetchFn, urls } = fakeFetch(() => json([location(29, 0), location(30, 0)]));
    const weather = new WeatherForecaster(
      { baseUrl: "https://wx.test", userAgent: "test", fetchFn },
      today,
    );
    await weather.forecast(points, "2026-10-15", "2026-10-25");
    expect(urls[0]).toContain("start_date=2026-10-15");
    expect(urls[0]).toContain("end_date=2026-10-17");
  });

  it("reports a failed service as unavailable instead of guessing", async () => {
    const { fetchFn } = fakeFetch(() => new Response("down", { status: 503 }));
    const weather = new WeatherForecaster(
      { baseUrl: "https://wx.test", userAgent: "test", fetchFn },
      today,
    );
    expect(await weather.forecast(points, "2026-10-12", "2026-10-12")).toEqual({
      available: false,
      reason: "The weather service didn't respond.",
    });
  });

  it("puts weather codes into words and admits what it doesn't know", () => {
    expect(describeWeatherCode(95)).toBe("Thunderstorm");
    expect(describeWeatherCode(1234)).toBeNull();
    expect(describeWeatherCode(null)).toBeNull();
  });
});

describe("places", () => {
  // A straight 100 km line heading east along latitude 15.
  const line = measureLine(
    Array.from({ length: 101 }, (_, i) => ({ lat: 15, lon: 74 + i * 0.00925 })),
    100,
  );
  const at = (km: number, offsetLat = 0) => ({ lat: 15 + offsetLat, lon: 74 + km * 0.00925 });

  it("keeps real places on the way, in route order, with stable ids", () => {
    const places = selectCandidates(
      [
        {
          type: "node",
          id: 1,
          ...at(50),
          tags: { place: "town", name: "Midtown", "name:en": "Mid Town" },
        },
        { type: "node", id: 2, ...at(20), tags: { place: "town", name: "Firstville" } },
        {
          type: "way",
          id: 3,
          center: at(30, 0.002),
          tags: { amenity: "fuel", brand: "Indian Oil" },
        },
        { type: "node", id: 4, ...at(70, 0.01), tags: { tourism: "viewpoint", name: "Ghat View" } },
      ],
      line,
    );
    expect(
      places.map((place) => [place.id, place.name, place.kind, Math.round(place.kmFromStart)]),
    ).toEqual([
      ["town-1", "Firstville", "town", 20],
      ["fuel-1", "Indian Oil fuel station", "fuel", 30],
      ["town-2", "Mid Town", "town", 50],
      ["viewpoint-1", "Ghat View", "viewpoint", 70],
    ]);
  });

  it("drops places that are off the route, unnamed or at either end", () => {
    const places = selectCandidates(
      [
        { type: "node", id: 1, ...at(50, 0.5), tags: { place: "town", name: "Faraway" } },
        { type: "node", id: 2, ...at(40), tags: { amenity: "fuel" } },
        { type: "node", id: 3, ...at(1), tags: { place: "city", name: "Origin City" } },
        { type: "node", id: 4, ...at(99), tags: { place: "city", name: "Destination City" } },
        { type: "node", id: 5, ...at(60), tags: { amenity: "bank", name: "Some Bank" } },
      ],
      line,
    );
    expect(places).toEqual([]);
  });

  it("keeps one fuel station per stretch: the one nearest the road", () => {
    const places = selectCandidates(
      [
        { type: "node", id: 1, ...at(10, 0.006), tags: { amenity: "fuel", name: "Further Fuels" } },
        {
          type: "node",
          id: 2,
          ...at(12, 0.001),
          tags: { amenity: "fuel", name: "Roadside Fuels" },
        },
        { type: "node", id: 3, ...at(60, 0.001), tags: { amenity: "fuel", name: "Later Fuels" } },
      ],
      line,
    );
    expect(places.map((place) => place.name)).toEqual(["Roadside Fuels", "Later Fuels"]);
  });

  it("asks the places service once per route and reports failure as unavailable", async () => {
    const { fetchFn, urls } = fakeFetch(() =>
      json({
        elements: [{ type: "node", id: 1, ...at(50), tags: { place: "town", name: "Midtown" } }],
      }),
    );
    const finder = new PlaceFinder({
      baseUrls: ["https://places.test/api"],
      userAgent: "test",
      fetchFn,
    });
    const first = await finder.alongRoute("route-a", line);
    await finder.alongRoute("route-a", line);
    expect(first).toMatchObject({ available: true, places: [{ id: "town-1", name: "Midtown" }] });
    expect(urls).toHaveLength(1);

    const busy = fakeFetch(() => new Response("rate limited", { status: 429 }));
    const failing = new PlaceFinder({
      baseUrls: ["https://places.test/api"],
      userAgent: "test",
      fetchFn: busy.fetchFn,
    });
    expect(await failing.alongRoute("route-b", line)).toEqual({ available: false });
  });

  it("asks the second endpoint only when the first doesn't answer", async () => {
    const town = { type: "node", id: 1, ...at(50), tags: { place: "town", name: "Midtown" } };
    const { fetchFn, urls } = fakeFetch((url) =>
      url.startsWith("https://busy.test")
        ? new Response("too busy", { status: 504 })
        : json({ elements: [town] }),
    );
    const finder = new PlaceFinder({
      baseUrls: ["https://busy.test/api", "https://spare.test/api"],
      userAgent: "test",
      fetchFn,
    });
    expect(await finder.alongRoute("route-c", line)).toMatchObject({
      available: true,
      places: [{ name: "Midtown" }],
    });
    expect(urls).toEqual(["https://busy.test/api", "https://spare.test/api"]);

    const healthy = fakeFetch(() => json({ elements: [town] }));
    await new PlaceFinder({
      baseUrls: ["https://first.test/api", "https://spare.test/api"],
      userAgent: "test",
      fetchFn: healthy.fetchFn,
    }).alongRoute("route-d", line);
    expect(healthy.urls).toEqual(["https://first.test/api"]);
  });
});
