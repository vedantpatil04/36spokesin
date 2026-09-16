/**
 * Phase 1 mock journey planner.
 *
 * `generateMockTravelPlan` is a pure, deterministic function over the sample
 * routes in src/data/journey-planner.ts. It stands in for a future planning
 * service (routing, forecasts, stays). When that service exists, replace this
 * module with a request that resolves to the same `TravelPlan` shape.
 *
 * No network, AI, weather or maps are used here. The UI imports this module
 * lazily, so it is not part of the initial homepage bundle.
 */

import { bikes, type Bike } from "@/data/content";
import {
  climate,
  journeyRoutes,
  planAssumptions,
  tripStyles,
  type RouteStop,
  type Season,
  type TravelPlan,
  type TravelPlanDay,
  type TravelPlanNotice,
  type TravelPlanRequest,
  type TripStyle,
} from "@/data/journey-planner";
import { addDays, daysBetween, parseISODate, toISODate } from "@/lib/dates";
import { formatDuration, validatePlanRequest } from "@/lib/journey-planner";

/* --------------------------------- Helpers --------------------------------- */

function seasonForMonth(monthIndex: number): Season {
  if (monthIndex === 11 || monthIndex <= 1) return "winter";
  if (monthIndex <= 4) return "summer";
  if (monthIndex <= 8) return "monsoon";
  return "post-monsoon";
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function cumulativeKm(stops: RouteStop[]): number[] {
  const result: number[] = [];
  let running = 0;
  for (const stop of stops) {
    running += stop.kmFromPrevious;
    result.push(running);
  }
  return result;
}

/**
 * Picks overnight stops so riding days are as even as possible (minimises the
 * sum of squared day distances). Only stops with a stay can end a day. Routes
 * have fewer than a dozen candidate stops, so an exhaustive search is cheap.
 */
function chooseOvernightIndices(
  stops: RouteStop[],
  cumulative: number[],
  dayCount: number,
): number[] {
  const lastIndex = stops.length - 1;
  const candidates = stops
    .map((stop, index) => (index > 0 && index < lastIndex && stop.stay ? index : -1))
    .filter((index) => index > 0);
  const splitsNeeded = Math.min(dayCount - 1, candidates.length);

  let best: number[] = [];
  let bestScore = Number.POSITIVE_INFINITY;

  const search = (fromPointer: number, chosen: number[]) => {
    if (chosen.length === splitsNeeded) {
      const ends = [...chosen, lastIndex];
      let previousKm = 0;
      let score = 0;
      for (const index of ends) {
        const km = (cumulative[index] ?? 0) - previousKm;
        score += km * km;
        previousKm = cumulative[index] ?? 0;
      }
      if (score < bestScore) {
        bestScore = score;
        best = chosen;
      }
      return;
    }
    for (let p = fromPointer; p <= candidates.length - (splitsNeeded - chosen.length); p++) {
      const index = candidates[p];
      if (index !== undefined) search(p + 1, [...chosen, index]);
    }
  };
  search(0, []);

  return [...best, lastIndex];
}

function fuelGaps(stops: RouteStop[], cumulative: number[]) {
  const fuelIndices = stops
    .map((stop, index) => (stop.fuel ? index : -1))
    .filter((index) => index >= 0);
  const lastIndex = stops.length - 1;
  return fuelIndices.map((index, i) => {
    const nextIndex = fuelIndices[i + 1] ?? lastIndex;
    return {
      index,
      nextIndex,
      gapKm: (cumulative[nextIndex] ?? 0) - (cumulative[index] ?? 0),
    };
  });
}

function spareLitresNeeded(gapKm: number, rangeKm: number, effectiveKmpl: number): number {
  if (gapKm <= rangeKm) return 0;
  return Math.ceil((gapKm - rangeKm) / effectiveKmpl) + 1;
}

/* -------------------------------- Generator -------------------------------- */

export function generateMockTravelPlan(request: TravelPlanRequest): TravelPlan | null {
  if (validatePlanRequest(request).length > 0) return null;

  const route = journeyRoutes.find((r) => r.id === request.routeId);
  const bike: Bike | undefined = bikes.find((b) => b.id === request.bikeId);
  const style = tripStyles.find((s) => s.id === request.style) ?? tripStyles[1];
  const start = parseISODate(request.startDate);
  const end = parseISODate(request.endDate);
  if (!route || !bike || !style || !start || !end) return null;

  const { stops } = route;
  const terrain = planAssumptions.terrain[route.terrain];
  const cumulative = cumulativeKm(stops);
  const lastIndex = stops.length - 1;
  const totalKm = cumulative[lastIndex] ?? 0;
  const intermediateStays = stops.filter(
    (stop, index) => index > 0 && index < lastIndex && stop.stay,
  ).length;

  /* How many riding days? */
  const maxDays = intermediateStays + 1;
  const minDays = Math.min(maxDays, Math.max(1, Math.ceil(totalKm / terrain.maxDailyKm)));
  const clampDays = (value: number) => Math.min(maxDays, Math.max(minDays, value));

  const recommended = clampDays(
    style.id === "Weekend"
      ? totalKm <= 220
        ? 1
        : 2
      : Math.ceil(totalKm / (style.dailyKm * terrain.paceFactor) - 0.15),
  );
  const availableDays = daysBetween(start, end) + 1;

  const notices: TravelPlanNotice[] = [];
  let dayCount = recommended;
  if (availableDays < minDays) {
    dayCount = minDays;
    notices.push({
      tone: "warning",
      message: `Your dates give you ${availableDays} ${availableDays === 1 ? "day" : "days"}, but this route needs at least ${minDays} riding days. The plan below uses ${minDays}.`,
    });
  } else if (availableDays < recommended) {
    dayCount = availableDays;
    notices.push({
      tone: "info",
      message: `A ${style.id.toLowerCase()} plan would use ${recommended} days. Your dates allow ${availableDays}, so expect longer days in the saddle.`,
    });
  } else if (availableDays > recommended) {
    const spare = availableDays - recommended;
    notices.push({
      tone: "info",
      message: `You have ${spare} spare ${spare === 1 ? "day" : "days"}. Good for a rest day in ${route.to} or weather on the way.`,
    });
  }

  if (route.advisory && (style.id === "Fast-paced" || style.id === "Weekend" || dayCount <= 2)) {
    notices.push({ tone: "warning", message: route.advisory });
  }

  /* Fuel range for this bike on this terrain */
  const effectiveKmpl = bike.fuelEfficiencyKmpl * terrain.efficiencyFactor;
  const tankRangeKm = roundTo(bike.tankLitres * effectiveKmpl * planAssumptions.usableTankShare, 5);
  const gaps = fuelGaps(stops, cumulative);
  const longestGap = gaps.reduce((longest, gap) => (gap.gapKm > longest.gapKm ? gap : longest), {
    index: 0,
    nextIndex: lastIndex,
    gapKm: 0,
  });
  const longestSpare = spareLitresNeeded(longestGap.gapKm, tankRangeKm, effectiveKmpl);
  if (longestSpare > 0) {
    notices.push({
      tone: "warning",
      message: `The longest stretch without fuel is about ${longestGap.gapKm} km (${stops[longestGap.index]?.name} to ${stops[longestGap.nextIndex]?.name}). A ${bike.model} covers roughly ${tankRangeKm} km on a tank here, so carry ${longestSpare} L spare.`,
    });
  }

  /* Build days */
  const overnightIndices = chooseOvernightIndices(stops, cumulative, dayCount);
  const placesPerDay = style.id === "Fast-paced" ? 2 : 3;
  const days: TravelPlanDay[] = [];
  let fromIndex = 0;

  overnightIndices.forEach((toIndex, i) => {
    const fromStop = stops[fromIndex];
    const toStop = stops[toIndex];
    if (!fromStop || !toStop) return;

    const segment = stops.slice(fromIndex + 1, toIndex + 1);
    const distanceKm = (cumulative[toIndex] ?? 0) - (cumulative[fromIndex] ?? 0);
    const date = addDays(start, i);

    // Places: arrival highlights first claim up to two slots, the road in fills the rest.
    const arrival = toStop.highlights.slice(0, placesPerDay === 2 ? 1 : 2);
    const along = segment.slice(0, -1).flatMap((stop) => stop.highlights);
    const places = [...along.slice(0, placesPerDay - arrival.length), ...arrival];
    if (places.length < placesPerDay) {
      for (const extra of toStop.highlights) {
        if (places.length >= placesPerDay) break;
        if (!places.includes(extra)) places.push(extra);
      }
    }

    // Fuel: flag a top-up before any long dry stretch ridden today, otherwise
    // suggest a natural mid-day stop, otherwise fill up before leaving.
    const dayFuel = gaps.filter((gap) => gap.index >= fromIndex && gap.index < toIndex);
    const critical = dayFuel
      .filter((gap) => gap.gapKm >= tankRangeKm * 0.6)
      .reduce<(typeof dayFuel)[number] | undefined>(
        (top, gap) => (!top || gap.gapKm > top.gapKm ? gap : top),
        undefined,
      );
    const midpointKm = ((cumulative[fromIndex] ?? 0) + (cumulative[toIndex] ?? 0)) / 2;
    const midDay = dayFuel
      .filter((gap) => gap.index > fromIndex)
      .reduce<(typeof dayFuel)[number] | undefined>(
        (top, gap) =>
          !top ||
          Math.abs((cumulative[gap.index] ?? 0) - midpointKm) <
            Math.abs((cumulative[top.index] ?? 0) - midpointKm)
            ? gap
            : top,
        undefined,
      );

    let fuel: TravelPlanDay["fuel"];
    if (critical) {
      const spare = spareLitresNeeded(critical.gapKm, tankRangeKm, effectiveKmpl);
      const nextName = stops[critical.nextIndex]?.name ?? route.to;
      const lead = critical.index === fromIndex ? "Fill up before you leave" : "Fill the tank here";
      fuel = {
        stop: stops[critical.index]?.name ?? fromStop.name,
        note:
          spare > 0
            ? `${lead} and carry ${spare} L spare. Next fuel is about ${critical.gapKm} km away at ${nextName}.`
            : `${lead}. Next fuel is about ${critical.gapKm} km away at ${nextName}.`,
      };
    } else if (midDay) {
      fuel = { stop: stops[midDay.index]?.name ?? toStop.name };
    } else if (dayFuel.length > 0) {
      fuel = { stop: fromStop.name, note: "Top up before you leave. There's no fuel on the way." };
    } else {
      const lastFuel = [...gaps].reverse().find((gap) => gap.index < fromIndex);
      fuel = {
        stop: "No fuel on this stretch",
        note: lastFuel
          ? `Leave with a full tank from ${stops[lastFuel.index]?.name}.`
          : "Leave with a full tank.",
      };
    }

    const month = date.getUTCMonth();
    const weather = climate[toStop.climate][seasonForMonth(month)];

    const fuelCost = roundTo((distanceKm / effectiveKmpl) * planAssumptions.fuelPricePerLitre, 10);
    const stayCost = toStop.stay?.pricePerNight ?? 0;
    const foodCost = planAssumptions.foodPerDay;

    days.push({
      day: i + 1,
      date: toISODate(date),
      from: fromStop.name,
      to: toStop.name,
      distanceKm,
      ridingMinutes: roundTo((distanceKm / terrain.avgSpeedKmh) * 60, 15),
      ...(toStop.elevationM !== undefined ? { elevationM: toStop.elevationM } : {}),
      stay: toStop.stay ?? null,
      places,
      weather,
      fuel,
      cost: {
        fuel: fuelCost,
        stay: stayCost,
        food: foodCost,
        total: fuelCost + stayCost + foodCost,
      },
    });

    fromIndex = toIndex;
  });

  const longestDay = days.reduce<TravelPlanDay | undefined>(
    (top, day) => (!top || day.ridingMinutes > top.ridingMinutes ? day : top),
    undefined,
  );
  if (longestDay && longestDay.ridingMinutes >= 8 * 60) {
    notices.push({
      tone: "info",
      message: `Day ${longestDay.day} is about ${formatDuration(longestDay.ridingMinutes)} of riding. Start at first light.`,
    });
  }

  return {
    request,
    from: route.from,
    to: route.to,
    via: route.via,
    bikeName: `${bike.brand} ${bike.model}`,
    style: style.id as TripStyle,
    styleTip: style.tip,
    overnights: [route.stops[0]?.name ?? route.from, ...days.map((day) => day.to)],
    totalKm,
    totalCost: days.reduce((sum, day) => sum + day.cost.total, 0),
    tankRangeKm,
    days,
    notices,
    source: "sample",
  };
}
