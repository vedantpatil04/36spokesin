/**
 * Journey planner contract.
 *
 * A JourneyPlan is built by the API (backend/src/plan): the places, route,
 * distance, riding time, weather and stops come from real data sources, named in
 * `sources`; an AI model only lays out the days and writes the notes. The UI
 * shows a plan as it arrives and never adds figures of its own.
 */

import type { ID, ISODate } from "./common";

export type RidingStyle = "relaxed" | "balanced" | "spirited";

/** What a rider enters. The first four are enough; the rest refine the plan. */
export type JourneyPlanInput = {
  origin: string;
  destination: string;
  date: ISODate;
  riders: number;
  /** A motorcycle from the catalogue; its listed mileage and tank size are used. */
  bikeId?: ID;
  /** The rider's own mileage, in km per litre. Overrides the catalogue's. */
  mileageKmpl?: number;
  /** INR per litre. Without it no fuel cost is shown. */
  fuelPricePerLitre?: number;
  ridingStyle?: RidingStyle;
  dailyDistanceKm?: number;
  tripDays?: number;
  /** INR. Context for the planner; costs other than fuel aren't estimated. */
  budget?: number;
};

/** A place name as the geocoder resolved it. */
export type JourneyPlace = {
  name: string;
  displayName: string;
  lat: number;
  lon: number;
};

export type JourneyStopKind = "town" | "fuel" | "food" | "viewpoint";

export type JourneyStop = {
  name: string;
  kind: JourneyStopKind;
  lat: number;
  lon: number;
  kmFromStart: number;
  /** Why the planner suggests stopping here. Written by the AI. */
  reason: string;
  suggestedMinutes: number | null;
};

/** One day's forecast at one point. Any figure the provider didn't give is null. */
export type JourneyDailyWeather = {
  date: ISODate;
  tempMaxC: number | null;
  tempMinC: number | null;
  rainChancePct: number | null;
  windKph: number | null;
  condition: string | null;
};

export type JourneyDay = {
  day: number;
  date: ISODate;
  start: string;
  end: string;
  distanceKm: number;
  estimatedRideMinutes: number;
  stops: JourneyStop[];
  /** Forecast near where the day ends; null when unavailable. */
  weather: (JourneyDailyWeather & { at: string }) | null;
  notes: string[];
};

/** Per motorcycle, for the whole route. Fields are null when there isn't enough information. */
export type JourneyFuelEstimate = {
  mileageKmpl: number | null;
  mileageSource: "rider" | "catalogue" | null;
  tankLitres: number | null;
  rangeKm: number | null;
  requiredLitres: number | null;
  pricePerLitre: number | null;
  priceSource: "rider" | "configured" | null;
  /** INR. */
  estimatedCost: number | null;
};

export type JourneyPlan = {
  version: 1;
  origin: JourneyPlace;
  destination: JourneyPlace;
  travelDate: ISODate;
  riders: number;
  distanceKm: number;
  estimatedRideMinutes: number;
  /** 24-hour "HH:MM". */
  recommendedStart: string;
  overview: string;
  days: JourneyDay[];
  breakAdvice: string;
  ridingNotes: string[];
  weather: {
    available: boolean;
    reason: string | null;
    /** The AI's reading of the forecast in `points`. */
    summary: string | null;
    points: { label: string; kmFromStart: number; days: JourneyDailyWeather[] }[];
  };
  fuel: JourneyFuelEstimate;
  bikeName: string | null;
  preferences: { ridingStyle: RidingStyle; dailyTargetKm: number; budget: number | null };
  /** False when the places source didn't answer, so no stops could be suggested. */
  placesAvailable: boolean;
  /** The road geometry from the routing service, as [lat, lon] pairs. */
  route: { geometry: [number, number][] };
  /** Where each kind of fact came from. Null when that source gave nothing. */
  sources: {
    geocoding: string;
    routing: string;
    weather: string | null;
    places: string | null;
    itinerary: string;
  };
  generatedAt: string;
};

/** A plan with the token that proves the API made it; both are sent back to save it. */
export type PlannedJourney = { plan: JourneyPlan; token: string };

export type SavedJourneySummary = {
  id: ID;
  title: string;
  originName: string;
  destinationName: string;
  travelDate: ISODate;
  riders: number;
  distanceKm: number;
  rideMinutes: number;
  createdAt: string;
};

export type SavedJourney = SavedJourneySummary & { plan: JourneyPlan };
