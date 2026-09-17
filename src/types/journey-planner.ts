/**
 * Journey planner contract.
 *
 * The planner UI is built against TravelPlan. In Phase 1–2 a deterministic mock
 * generator (src/lib/mock-travel-plan.ts) produces it from sample routes; a
 * future routing / weather / stays service must return the same shape.
 */

import type { ISODate } from "./common";

export type TripStyle = "Adventure" | "Scenic" | "Relaxed" | "Fast-paced" | "Weekend";

export type ClimateZone =
  "konkan-coast" | "western-ghats" | "deccan-plateau" | "himalaya-mid" | "himalaya-high";

export type Terrain = "plains" | "ghats" | "coast" | "high-altitude";

export type Season = "winter" | "summer" | "monsoon" | "post-monsoon";

export type StayKind = "Homestay" | "Hotel" | "Guesthouse" | "Camp" | "Beach hut";

export type Stay = {
  name: string;
  kind: StayKind;
  pricePerNight: number;
};

export type RouteStop = {
  name: string;
  region: string;
  kmFromPrevious: number;
  climate: ClimateZone;
  elevationM?: number;
  fuel?: boolean;
  /** Present when riders can realistically stop overnight here. */
  stay?: Stay;
  /** Places worth stopping for on the way into, or around, this stop. */
  highlights: string[];
};

export type JourneyRoute = {
  id: string;
  from: string;
  to: string;
  via: string;
  terrain: Terrain;
  /** Shown when the chosen pace is too quick for the route (e.g. altitude). */
  advisory?: string;
  stops: RouteStop[];
};

export type WeatherOutlook = {
  summary: string;
  minC: number;
  maxC: number;
  note?: string;
};

export type TravelPlanRequest = {
  routeId: string;
  bikeId: string;
  style: TripStyle;
  startDate: ISODate;
  endDate: ISODate;
};

export type TravelPlanNotice = {
  tone: "info" | "warning";
  message: string;
};

export type TravelPlanDay = {
  day: number;
  date: ISODate;
  from: string;
  to: string;
  distanceKm: number;
  ridingMinutes: number;
  elevationM?: number;
  stay: Stay | null;
  places: string[];
  weather: WeatherOutlook;
  fuel: { stop: string; note?: string };
  cost: { fuel: number; stay: number; food: number; total: number };
};

export type TravelPlan = {
  request: TravelPlanRequest;
  from: string;
  to: string;
  via: string;
  bikeName: string;
  style: TripStyle;
  styleTip: string;
  /** Overnight points in order, starting point first. */
  overnights: string[];
  totalKm: number;
  totalCost: number;
  /** Approximate distance the chosen bike covers on one tank on this terrain. */
  tankRangeKm: number;
  days: TravelPlanDay[];
  notices: TravelPlanNotice[];
  /** Phase 1 plans are generated from sample data only. */
  source: "sample";
};
