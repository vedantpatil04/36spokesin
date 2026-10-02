import type { LatLon, RouteData } from "../plan.types.js";
import { round } from "../support/geometry.js";
import { TtlCache } from "../support/ttl-cache.js";
import { type FetchLike, fetchJson } from "../support/upstream.js";

type OsrmResponse = {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
  }[];
};

export type RouterOptions = { baseUrl: string; userAgent: string; fetchFn?: FetchLike };

const TIMEOUT_MS = 20_000;

/**
 * Road routes from an OSRM-compatible service (OpenStreetMap data): the real
 * distance, the service's own time estimate and the road geometry. Cached for
 * a day: roads don't move between requests.
 */
export class RouteFinder {
  readonly source = "OSRM (OpenStreetMap roads)";
  private readonly cache = new TtlCache<RouteData | null>(24 * 3600 * 1000, 300);

  constructor(private readonly options: RouterOptions) {}

  /** Null when no road route connects the two points. Throws UpstreamError when the service fails. */
  route(from: LatLon, to: LatLon): Promise<RouteData | null> {
    const pair = `${from.lon.toFixed(5)},${from.lat.toFixed(5)};${to.lon.toFixed(5)},${to.lat.toFixed(5)}`;
    return this.cache.getOrLoad(pair, () => this.fetchRoute(pair));
  }

  private async fetchRoute(pair: string): Promise<RouteData | null> {
    let body: OsrmResponse;
    try {
      body = await fetchJson<OsrmResponse>(
        {
          service: "routing",
          url: `${this.options.baseUrl}/route/v1/driving/${pair}?overview=full&geometries=geojson&steps=false&alternatives=false`,
          userAgent: this.options.userAgent,
          timeoutMs: TIMEOUT_MS,
        },
        this.options.fetchFn,
      );
    } catch (error) {
      // OSRM answers 400 with code "NoRoute"/"NoSegment" when the points can't be joined by road.
      if (error instanceof Error && /No(Route|Segment)/.test(error.message)) return null;
      throw error;
    }

    const route = body.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (body.code !== "Ok" || !route || !coordinates || coordinates.length < 2) return null;
    return {
      distanceKm: round(route.distance / 1000, 1),
      durationMinutes: Math.round(route.duration / 60),
      geometry: coordinates.map(([lon, lat]) => ({ lat, lon })),
    };
  }
}
