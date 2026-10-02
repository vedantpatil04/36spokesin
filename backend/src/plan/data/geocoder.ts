import type { ResolvedPlace } from "../plan.types.js";
import { TtlCache } from "../support/ttl-cache.js";
import { type FetchLike, fetchJson } from "../support/upstream.js";

type NominatimResult = {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  addresstype?: string;
};

/** Areas a rider doesn't ride "to": a district or taluk that shares its name with its main town. */
const DISTRICT_LEVEL = new Set(["state_district", "county", "district", "region"]);
const SETTLEMENT = new Set(["city", "town", "village", "municipality", "suburb", "hamlet"]);

/**
 * The geocoder's best match, except that a town beats the district named after
 * it: "Belagavi" means the city, not the middle of Belagavi district 45 km away.
 */
export function pickResult(results: NominatimResult[]): NominatimResult | undefined {
  const first = results[0];
  if (!first || !DISTRICT_LEVEL.has(first.addresstype ?? "")) return first;
  const town = results.find(
    (result) => SETTLEMENT.has(result.addresstype ?? "") && result.name === first.name,
  );
  return town ?? first;
}

export type GeocoderOptions = {
  baseUrl: string;
  userAgent: string;
  /** Comma-separated ISO country codes, or "" for worldwide. */
  countryCodes: string;
  fetchFn?: FetchLike;
};

/** Nominatim's usage policy allows at most one request per second. */
const MIN_INTERVAL_MS = 1100;
const TIMEOUT_MS = 12_000;

/**
 * Turns a place name into coordinates with a Nominatim-compatible geocoder
 * (OpenStreetMap). Lookups are cached for a week and sent one at a time, at
 * least a second apart, as the public service asks.
 */
export class Geocoder {
  readonly source = "OpenStreetMap (Nominatim)";
  private readonly cache = new TtlCache<ResolvedPlace | null>(7 * 24 * 3600 * 1000, 1000);
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(private readonly options: GeocoderOptions) {}

  /** Null when the geocoder knows no such place. Throws UpstreamError when it can't be asked. */
  resolve(query: string): Promise<ResolvedPlace | null> {
    const key = query.trim().toLowerCase().replace(/\s+/g, " ");
    return this.cache.getOrLoad(key, () => this.enqueue(() => this.lookup(query.trim())));
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = async () => {
      const wait = this.lastRequestAt + MIN_INTERVAL_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      try {
        return await task();
      } finally {
        this.lastRequestAt = Date.now();
      }
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async lookup(query: string): Promise<ResolvedPlace | null> {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "5",
      "accept-language": "en",
    });
    if (this.options.countryCodes) params.set("countrycodes", this.options.countryCodes);

    const results = await fetchJson<NominatimResult[]>(
      {
        service: "geocoding",
        url: `${this.options.baseUrl}/search?${params.toString()}`,
        userAgent: this.options.userAgent,
        timeoutMs: TIMEOUT_MS,
      },
      this.options.fetchFn,
    );
    const first = Array.isArray(results) ? pickResult(results) : undefined;
    const lat = Number(first?.lat);
    const lon = Number(first?.lon);
    if (!first || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const displayName = first.display_name ?? query;
    return { lat, lon, name: first.name || displayName.split(",")[0]!.trim(), displayName };
  }
}
