import type { LatLon } from "../plan.types.js";

const EARTH_RADIUS_KM = 6371.0088;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLon, b: LatLon): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * A route line with the distance travelled at each vertex, scaled so the last
 * vertex sits at the routing service's own total (straight segments between
 * vertices come out a little shorter than the road).
 */
export type MeasuredLine = { points: LatLon[]; km: number[] };

export function measureLine(points: LatLon[], totalKm: number): MeasuredLine {
  const raw = [0];
  for (let i = 1; i < points.length; i++) {
    raw.push((raw[i - 1] ?? 0) + haversineKm(points[i - 1]!, points[i]!));
  }
  const rawTotal = raw[raw.length - 1] ?? 0;
  const scale = rawTotal > 0 ? totalKm / rawTotal : 0;
  return { points, km: raw.map((value) => value * scale) };
}

/** Evenly thins a line to at most `max` points, always keeping both ends. */
export function thinLine<T>(points: T[], max: number): T[] {
  if (points.length <= max || max < 2) return points;
  const step = (points.length - 1) / (max - 1);
  const thinned: T[] = [];
  for (let i = 0; i < max; i++) thinned.push(points[Math.round(i * step)]!);
  return thinned;
}

/** Where on the line a place is nearest to it: distance along, and how far off. */
export function locateOnLine(
  line: MeasuredLine,
  place: LatLon,
): { kmFromStart: number; offRouteKm: number } {
  let best = { kmFromStart: 0, offRouteKm: Number.POSITIVE_INFINITY };
  for (let i = 0; i < line.points.length; i++) {
    const distance = haversineKm(line.points[i]!, place);
    if (distance < best.offRouteKm) best = { kmFromStart: line.km[i] ?? 0, offRouteKm: distance };
  }
  return best;
}

/** The vertex nearest to a given distance along the line. */
export function pointAtKm(line: MeasuredLine, km: number): LatLon {
  let nearest = 0;
  for (let i = 1; i < line.km.length; i++) {
    if (Math.abs((line.km[i] ?? 0) - km) < Math.abs((line.km[nearest] ?? 0) - km)) nearest = i;
  }
  return line.points[nearest]!;
}

export type BoundingBox = { south: number; west: number; north: number; east: number };

export function boundingBox(points: LatLon[], paddingDegrees = 0): BoundingBox {
  let south = 90;
  let west = 180;
  let north = -90;
  let east = -180;
  for (const point of points) {
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
    west = Math.min(west, point.lon);
    east = Math.max(east, point.lon);
  }
  return {
    south: south - paddingDegrees,
    west: west - paddingDegrees,
    north: north + paddingDegrees,
    east: east + paddingDegrees,
  };
}

export const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
