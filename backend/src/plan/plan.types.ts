/** Shapes shared by the journey planner's data sources, AI step and plan builder. */

export type LatLon = { lat: number; lon: number };

/** A place name the geocoder resolved to coordinates. */
export type ResolvedPlace = LatLon & {
  /** Short name, e.g. "Belagavi". */
  name: string;
  /** Full label from the geocoder, e.g. "Belagavi, Karnataka, India". */
  displayName: string;
};

/** A route as the routing service returned it. */
export type RouteData = {
  distanceKm: number;
  durationMinutes: number;
  /** The road geometry, start to finish. */
  geometry: LatLon[];
};

export const PLACE_KINDS = ["town", "fuel", "food", "viewpoint"] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

/** A real place near the route, from the places source. The AI may only pick from these. */
export type RoutePlace = LatLon & {
  /** Stable within one plan request, e.g. "town-3". */
  id: string;
  name: string;
  kind: PlaceKind;
  /** Distance along the route where this place is nearest to it. */
  kmFromStart: number;
  offRouteKm: number;
};

export type DailyWeather = {
  date: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  rainChancePct: number | null;
  windKph: number | null;
  /** Plain words for the provider's weather code, e.g. "Light rain". */
  condition: string | null;
};

/** The forecast at one point of the route. */
export type WeatherPoint = LatLon & {
  label: string;
  kmFromStart: number;
  days: DailyWeather[];
};

export type WeatherData =
  { available: true; points: WeatherPoint[] } | { available: false; reason: string };

export const RIDING_STYLES = ["relaxed", "balanced", "spirited"] as const;
export type RidingStyle = (typeof RIDING_STYLES)[number];

/** Daily distance the planner aims for when the rider gives none. A planning setting, not a fact. */
export const DAILY_TARGET_KM: Record<RidingStyle, number> = {
  relaxed: 200,
  balanced: 300,
  spirited: 400,
};

export const MAX_TRIP_DAYS = 14;
export const MAX_ROUTE_KM = 5000;
