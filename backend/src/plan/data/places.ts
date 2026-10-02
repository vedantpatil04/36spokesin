import type { PlaceKind, RoutePlace } from "../plan.types.js";
import { type MeasuredLine, boundingBox, locateOnLine, round } from "../support/geometry.js";
import { TtlCache } from "../support/ttl-cache.js";
import { type FetchLike, fetchJson } from "../support/upstream.js";

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type PlacesOptions = {
  /** Overpass endpoints, tried in order until one answers. Never asked at the same time. */
  baseUrls: string[];
  userAgent: string;
  fetchFn?: FetchLike;
};

export type PlacesResult = { available: true; places: RoutePlace[] } | { available: false };

const TIMEOUT_MS = 18_000;
/** Padding around the route when asking for places, in degrees (about 9 km). */
const BBOX_PADDING = 0.08;
/** Above this area (square degrees) only towns are requested: the rest would be too heavy. */
const FULL_QUERY_MAX_AREA = 3;
/** How far from the road a place may be and still count as "on the way", in km. */
const MAX_OFF_ROUTE_KM: Record<PlaceKind, number> = { town: 10, fuel: 1, food: 0.6, viewpoint: 6 };
/** Places this close to either end are the start or the destination themselves. */
const END_MARGIN_KM = 5;
const MAX_CANDIDATES = 70;

/**
 * Real places near a route from OpenStreetMap (Overpass API): towns to stop or
 * stay in, fuel stations and viewpoints. One request per route, cached for a
 * day, because the public service is shared and rate-limited. The AI may only
 * choose stops from what this returns.
 */
export class PlaceFinder {
  readonly source = "OpenStreetMap (Overpass)";
  private readonly cache = new TtlCache<RoutePlace[]>(24 * 3600 * 1000, 200);

  constructor(private readonly options: PlacesOptions) {}

  async alongRoute(cacheKey: string, line: MeasuredLine): Promise<PlacesResult> {
    try {
      const places = await this.cache.getOrLoad(cacheKey, () => this.fetchPlaces(line));
      return { available: true, places };
    } catch {
      return { available: false };
    }
  }

  private async fetchPlaces(line: MeasuredLine): Promise<RoutePlace[]> {
    const box = boundingBox(line.points, BBOX_PADDING);
    const bbox = [box.south, box.west, box.north, box.east].map((n) => n.toFixed(4)).join(",");
    const area = (box.north - box.south) * (box.east - box.west);
    const towns = `node["place"~"^(city|town)$"]["name"](${bbox});`;
    const extras =
      area <= FULL_QUERY_MAX_AREA
        ? `nwr["amenity"="fuel"](${bbox});nwr["tourism"="viewpoint"]["name"](${bbox});`
        : "";
    const query = `[out:json][timeout:15];(${towns}${extras});out center tags 3000;`;

    let failure: unknown = new Error("no places endpoint is configured");
    for (const url of this.options.baseUrls) {
      try {
        const body = await fetchJson<{ elements?: OverpassElement[]; remark?: string }>(
          {
            service: "places",
            url,
            userAgent: this.options.userAgent,
            timeoutMs: TIMEOUT_MS,
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `data=${encodeURIComponent(query)}`,
          },
          this.options.fetchFn,
        );
        // A busy server can answer 200 with a "remark" and no data: that is a failure too.
        if (!Array.isArray(body.elements) || body.remark) {
          throw new Error("places answered without data");
        }
        return selectCandidates(body.elements, line);
      } catch (error) {
        failure = error;
      }
    }
    throw failure;
  }
}

function kindOf(tags: Record<string, string>): PlaceKind | null {
  if (tags["place"] === "city" || tags["place"] === "town") return "town";
  if (tags["amenity"] === "fuel") return "fuel";
  if (tags["tourism"] === "viewpoint") return "viewpoint";
  return null;
}

function nameOf(kind: PlaceKind, tags: Record<string, string>): string | null {
  const name = tags["name:en"] ?? tags["name"];
  if (name) return name.trim();
  // Many fuel stations carry only a brand or operator.
  const brand = tags["brand"] ?? tags["operator"];
  return kind === "fuel" && brand ? `${brand.trim()} fuel station` : null;
}

/**
 * Keeps the places that are actually on the way and thins them so the AI sees a
 * list it can reason about: every town, and fuel stations and viewpoints spread
 * along the route (the nearest to the road in each stretch).
 */
export function selectCandidates(elements: OverpassElement[], line: MeasuredLine): RoutePlace[] {
  const totalKm = line.km[line.km.length - 1] ?? 0;
  const nearRoute = elements.flatMap((element) => {
    const tags = element.tags ?? {};
    const kind = kindOf(tags);
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    const name = kind ? nameOf(kind, tags) : null;
    if (!kind || !name || lat === undefined || lon === undefined) return [];
    const { kmFromStart, offRouteKm } = locateOnLine(line, { lat, lon });
    if (offRouteKm > MAX_OFF_ROUTE_KM[kind]) return [];
    if (kmFromStart < END_MARGIN_KM || kmFromStart > totalKm - END_MARGIN_KM) return [];
    return [{ name, kind, lat, lon, kmFromStart, offRouteKm, city: tags["place"] === "city" }];
  });

  const spread = (kind: PlaceKind, stretchKm: number) => {
    const best = new Map<number, (typeof nearRoute)[number]>();
    for (const place of nearRoute.filter((candidate) => candidate.kind === kind)) {
      const stretch = Math.floor(place.kmFromStart / stretchKm);
      const current = best.get(stretch);
      // Cities win a stretch outright; otherwise the place nearest the road does.
      const better =
        !current ||
        (place.city && !current.city) ||
        (place.city === current.city && place.offRouteKm < current.offRouteKm);
      if (better) best.set(stretch, place);
    }
    return [...best.values()];
  };

  const chosen = [
    ...spread("town", Math.max(8, totalKm / 35)),
    ...spread("fuel", Math.max(25, totalKm / 18)),
    ...spread("viewpoint", Math.max(15, totalKm / 12)),
  ]
    .sort((a, b) => a.kmFromStart - b.kmFromStart)
    .slice(0, MAX_CANDIDATES);

  const counters: Partial<Record<PlaceKind, number>> = {};
  return chosen.map((place) => {
    const index = (counters[place.kind] = (counters[place.kind] ?? 0) + 1);
    return {
      id: `${place.kind}-${index}`,
      name: place.name,
      kind: place.kind,
      lat: round(place.lat, 5),
      lon: round(place.lon, 5),
      kmFromStart: round(place.kmFromStart, 1),
      offRouteKm: round(place.offRouteKm, 1),
    };
  });
}
