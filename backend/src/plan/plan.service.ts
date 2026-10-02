import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { invalidReference } from "../catalog/unique-slug.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { AppConfigService } from "../config/app-config.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { AiInvalidAnswerError, AiService, AiUnavailableError } from "./ai/ai.service.js";
import { Geocoder } from "./data/geocoder.js";
import { PlaceFinder } from "./data/places.js";
import { RouteFinder } from "./data/router.js";
import { WeatherForecaster, type WeatherRequestPoint } from "./data/weather.js";
import type { PlanJourneyDto } from "./dto/plan.dto.js";
import { buildPlan } from "./itinerary/build-plan.js";
import { estimateFuel } from "./itinerary/fuel.js";
import { checkItinerary } from "./itinerary/itinerary-check.js";
import { buildItineraryRequest } from "./itinerary/itinerary-prompt.js";
import type { JourneyPlan, PlanFacts } from "./itinerary/journey-plan.js";
import {
  DAILY_TARGET_KM,
  MAX_ROUTE_KM,
  MAX_TRIP_DAYS,
  type ResolvedPlace,
  type RouteData,
} from "./plan.types.js";
import { haversineKm, measureLine, pointAtKm, round, thinLine } from "./support/geometry.js";
import { PlanSigner, stableStringify } from "./support/plan-signature.js";
import { TtlCache } from "./support/ttl-cache.js";
import { UpstreamError } from "./support/upstream.js";

export type PlannedJourney = { plan: JourneyPlan; token: string };

/** Points used to place towns and stops along the route; plenty for km-level accuracy. */
const MEASURE_POINTS = 1500;
const MAX_DAYS_AHEAD = 365;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return isoDate(value);
}

const unprocessable = (code: ErrorCode, message: string, field?: string) =>
  new ApiException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    code,
    message,
    field ? [{ field, messages: [message] }] : undefined,
  );

const unavailable = (code: ErrorCode, message: string) =>
  new ApiException(HttpStatus.SERVICE_UNAVAILABLE, code, message);

/**
 * Plans a motorcycle journey. Facts first, from real services: the two places
 * (geocoder), the road route with its distance and time (router), the forecast
 * (weather) and the places on the way. Only then is the AI asked, with those
 * facts and nothing else, to lay out the days and stops. Its answer is checked
 * against the facts before anything is returned, and all numbers in the plan
 * come from the facts.
 */
@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);
  /** Identical requests within half an hour get the same plan without new provider calls. */
  private readonly plans = new TtlCache<PlannedJourney>(30 * 60 * 1000, 200);

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly geocoder: Geocoder,
    private readonly router: RouteFinder,
    private readonly weather: WeatherForecaster,
    private readonly places: PlaceFinder,
    private readonly ai: AiService,
    private readonly signer: PlanSigner,
  ) {}

  plan(dto: PlanJourneyDto): Promise<PlannedJourney> {
    const key = stableStringify({
      ...dto,
      origin: dto.origin.toLowerCase(),
      destination: dto.destination.toLowerCase(),
    });
    return this.plans.getOrLoad(key, () => this.generate(dto));
  }

  private async generate(dto: PlanJourneyDto): Promise<PlannedJourney> {
    this.assertDate(dto.date);
    const bike = await this.bike(dto.bikeModelId);

    const origin = await this.locate(dto.origin, "origin");
    const destination = await this.locate(dto.destination, "destination");
    if (haversineKm(origin, destination) < 1) {
      throw unprocessable(
        ErrorCode.ROUTE_NOT_FOUND,
        "The start and the destination are the same place.",
        "destination",
      );
    }

    const route = await this.route(origin, destination);
    const line = measureLine(thinLine(route.geometry, MEASURE_POINTS), route.distanceKm);

    const ridingStyle = dto.ridingStyle ?? "balanced";
    const dailyTargetKm = dto.dailyDistanceKm ?? DAILY_TARGET_KM[ridingStyle];
    const maxDays =
      dto.tripDays ??
      Math.min(MAX_TRIP_DAYS, Math.max(1, Math.ceil(route.distanceKm / dailyTargetKm)));

    // The forecast and the places don't depend on each other: fetch them together.
    const routeKey = `${origin.lat.toFixed(4)},${origin.lon.toFixed(4)};${destination.lat.toFixed(4)},${destination.lon.toFixed(4)}`;
    const [weather, places] = await Promise.all([
      this.weather.forecast(
        this.weatherPoints(origin, destination, route, line),
        dto.date,
        addDays(dto.date, maxDays - 1),
      ),
      this.places.alongRoute(routeKey, line),
    ]);

    const mileageKmpl = dto.mileageKmpl ?? bike?.mileageKmpl ?? null;
    const facts: PlanFacts = {
      origin,
      destination,
      travelDate: dto.date,
      riders: dto.riders,
      route: { distanceKm: route.distanceKm, durationMinutes: route.durationMinutes },
      placesAvailable: places.available,
      places: places.available ? places.places : [],
      weather,
      preferences: { ridingStyle, dailyTargetKm, maxDays, budget: dto.budget ?? null },
      bike: {
        name: bike?.name ?? null,
        mileageKmpl,
        tankLitres: bike?.tankLitres ?? null,
        rangeKm: mileageKmpl && bike?.tankLitres ? Math.round(mileageKmpl * bike.tankLitres) : null,
      },
    };

    const answer = await this.itinerary(facts);
    const plan = buildPlan(facts, answer.value, {
      geometry: route.geometry,
      fuel: estimateFuel({
        distanceKm: route.distanceKm,
        riderMileageKmpl: dto.mileageKmpl ?? null,
        catalogueMileageKmpl: bike?.mileageKmpl ?? null,
        tankLitres: bike?.tankLitres ?? null,
        riderPricePerLitre: dto.fuelPricePerLitre ?? null,
        configuredPricePerLitre: this.config.plan.fuelPricePerLitre,
      }),
      sources: {
        geocoding: this.geocoder.source,
        routing: this.router.source,
        weather: weather.available ? this.weather.source : null,
        places: places.available ? this.places.source : null,
        itinerary: `${answer.providerLabel} (${answer.model})`,
      },
      generatedAt: new Date(),
    });
    this.logger.log(
      {
        distanceKm: plan.distanceKm,
        days: plan.days.length,
        places: facts.places.length,
        weather: weather.available,
        provider: answer.provider,
      },
      "Journey planned",
    );
    return { plan, token: this.signer.sign(plan) };
  }

  // ─── Steps ───────────────────────────────────────────────────────────────

  private assertDate(date: string): void {
    const parsed = new Date(`${date}T00:00:00Z`);
    const now = Date.now();
    const valid = !Number.isNaN(parsed.getTime()) && isoDate(parsed) === date;
    // A day of slack on the past side: "today" in India can still be yesterday in UTC.
    const earliest = isoDate(new Date(now - 24 * 3600 * 1000));
    const latest = isoDate(new Date(now + MAX_DAYS_AHEAD * 24 * 3600 * 1000));
    if (!valid || date < earliest || date > latest) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        "Request validation failed.",
        [{ field: "date", messages: ["date must be today or later, within the next year"] }],
      );
    }
  }

  private async bike(bikeModelId: string | undefined) {
    if (!bikeModelId) return null;
    const model = await this.prisma.bikeModel.findUnique({
      where: { id: bikeModelId },
      select: {
        name: true,
        fuelEfficiencyKmpl: true,
        tankLitres: true,
        brand: { select: { name: true } },
      },
    });
    if (!model) throw invalidReference("bikeModelId", "Choose a motorcycle from the catalogue.");
    return {
      name: `${model.brand.name} ${model.name}`,
      mileageKmpl: model.fuelEfficiencyKmpl,
      tankLitres: model.tankLitres,
    };
  }

  private async locate(query: string, field: "origin" | "destination"): Promise<ResolvedPlace> {
    let place: ResolvedPlace | null;
    try {
      place = await this.geocoder.resolve(query);
    } catch (error) {
      this.logUpstream(error);
      throw unavailable(
        ErrorCode.SERVICE_UNAVAILABLE,
        "We couldn't look up places just now. Please try again.",
      );
    }
    if (!place) {
      throw unprocessable(
        ErrorCode.LOCATION_NOT_FOUND,
        `We couldn't find "${query}". Check the spelling or try a nearby town.`,
        field,
      );
    }
    return {
      name: place.name,
      displayName: place.displayName,
      lat: round(place.lat, 5),
      lon: round(place.lon, 5),
    };
  }

  private async route(origin: ResolvedPlace, destination: ResolvedPlace): Promise<RouteData> {
    let route: RouteData | null;
    try {
      route = await this.router.route(origin, destination);
    } catch (error) {
      this.logUpstream(error);
      throw unavailable(
        ErrorCode.ROUTE_UNAVAILABLE,
        "Route data is unavailable right now. Please try again.",
      );
    }
    if (!route) {
      throw unprocessable(
        ErrorCode.ROUTE_NOT_FOUND,
        "No road route was found between these two places.",
        "destination",
      );
    }
    if (route.distanceKm > MAX_ROUTE_KM) {
      throw unprocessable(
        ErrorCode.JOURNEY_TOO_LONG,
        `This route is ${Math.round(route.distanceKm)} km. Plan journeys of up to ${MAX_ROUTE_KM} km, or split it into legs.`,
        "destination",
      );
    }
    return route;
  }

  /** Start, destination and up to three points in between, depending on the length. */
  private weatherPoints(
    origin: ResolvedPlace,
    destination: ResolvedPlace,
    route: RouteData,
    line: ReturnType<typeof measureLine>,
  ): WeatherRequestPoint[] {
    const fractions =
      route.distanceKm > 400 ? [0.25, 0.5, 0.75] : route.distanceKm > 80 ? [0.5] : [];
    return [
      { label: origin.name, kmFromStart: 0, lat: origin.lat, lon: origin.lon },
      ...fractions.map((fraction) => {
        const km = route.distanceKm * fraction;
        return {
          label: `On the way, km ${Math.round(km)}`,
          kmFromStart: km,
          ...pointAtKm(line, km),
        };
      }),
      {
        label: destination.name,
        kmFromStart: route.distanceKm,
        lat: destination.lat,
        lon: destination.lon,
      },
    ];
  }

  private async itinerary(facts: PlanFacts) {
    try {
      return await this.ai.generate(buildItineraryRequest(facts), (text) =>
        checkItinerary(text, facts),
      );
    } catch (error) {
      if (error instanceof AiInvalidAnswerError) {
        this.logger.warn({ problems: error.problems }, "AI itinerary rejected twice");
        throw unavailable(
          ErrorCode.PLANNING_UNAVAILABLE,
          "We couldn't build a reliable plan this time. Please try again.",
        );
      }
      if (error instanceof AiUnavailableError) {
        throw unavailable(
          ErrorCode.PLANNING_UNAVAILABLE,
          "Travel planning is temporarily unavailable. Please try again.",
        );
      }
      throw error;
    }
  }

  private logUpstream(error: unknown): void {
    const detail = error instanceof UpstreamError ? error.message : String(error);
    this.logger.warn({ detail }, "Travel data source failed");
  }
}
