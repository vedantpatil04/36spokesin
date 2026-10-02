import type {
  DailyWeather,
  LatLon,
  PlaceKind,
  ResolvedPlace,
  RidingStyle,
  RoutePlace,
  WeatherData,
} from "../plan.types.js";

/**
 * Everything the planner knows for one request, gathered from the data sources
 * before the AI is asked anything. The AI sees this and nothing else.
 */
export type PlanFacts = {
  origin: ResolvedPlace;
  destination: ResolvedPlace;
  travelDate: string;
  riders: number;
  route: { distanceKm: number; durationMinutes: number };
  /** False when the places source didn't answer: no stops can be suggested. */
  placesAvailable: boolean;
  places: RoutePlace[];
  weather: WeatherData;
  preferences: {
    ridingStyle: RidingStyle;
    /** Distance to aim for per day: the rider's own figure, else the style's default. */
    dailyTargetKm: number;
    /** Most days the plan may use. */
    maxDays: number;
    budget: number | null;
  };
  bike: {
    name: string | null;
    mileageKmpl: number | null;
    tankLitres: number | null;
    /** Tank size times mileage, when both are known. */
    rangeKm: number | null;
  };
};

/** The AI's answer once it has the right shape. Still to be checked against the facts. */
export type ItineraryDraft = {
  overview: string;
  /** 24-hour "HH:MM". */
  recommendedStart: string;
  days: {
    day: number;
    /** A town's id, or "destination" on the last day. */
    endPlaceId: string;
    stops: { placeId: string; reason: string; minutes: number | null }[];
    notes: string[];
  }[];
  breakAdvice: string;
  weatherSummary: string | null;
  ridingNotes: string[];
};

export type PlanStop = LatLon & {
  name: string;
  kind: PlaceKind;
  kmFromStart: number;
  /** Why the planner suggests stopping here. Written by the AI. */
  reason: string;
  suggestedMinutes: number | null;
};

export type PlanDay = {
  day: number;
  date: string;
  start: string;
  end: string;
  distanceKm: number;
  estimatedRideMinutes: number;
  stops: PlanStop[];
  /** Forecast for this date near where the day ends; null when unavailable. */
  weather: (DailyWeather & { at: string }) | null;
  notes: string[];
};

export type FuelEstimate = {
  mileageKmpl: number | null;
  /** Where the mileage came from: the rider typed it, or the bike catalogue lists it. */
  mileageSource: "rider" | "catalogue" | null;
  tankLitres: number | null;
  rangeKm: number | null;
  /** Per motorcycle, for the whole route. Null without a mileage. */
  requiredLitres: number | null;
  pricePerLitre: number | null;
  priceSource: "rider" | "configured" | null;
  /** Per motorcycle, in INR. Null without both a mileage and a price. */
  estimatedCost: number | null;
};

/**
 * A finished journey plan. Distances, times, places, coordinates, weather and
 * fuel figures come from the data sources named in `sources` or from arithmetic
 * on them; `overview`, the choice and reasons of stops, notes and advice come
 * from the AI named in `sources.itinerary`.
 */
export type JourneyPlan = {
  version: 1;
  origin: ResolvedPlace;
  destination: ResolvedPlace;
  travelDate: string;
  riders: number;
  distanceKm: number;
  estimatedRideMinutes: number;
  recommendedStart: string;
  overview: string;
  days: PlanDay[];
  breakAdvice: string;
  ridingNotes: string[];
  weather: {
    available: boolean;
    /** Why there is no forecast, when there isn't. */
    reason: string | null;
    /** The AI's reading of the forecast below. Null when unavailable. */
    summary: string | null;
    points: { label: string; kmFromStart: number; days: DailyWeather[] }[];
  };
  fuel: FuelEstimate;
  bikeName: string | null;
  preferences: { ridingStyle: RidingStyle; dailyTargetKm: number; budget: number | null };
  /** False when no stops could be suggested because the places source didn't answer. */
  placesAvailable: boolean;
  /** The road geometry from the routing service, thinned, as [lat, lon] pairs. */
  route: { geometry: [number, number][] };
  sources: {
    geocoding: string;
    routing: string;
    weather: string | null;
    places: string | null;
    itinerary: string;
  };
  generatedAt: string;
};
