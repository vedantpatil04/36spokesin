import { round } from "../support/geometry.js";
import type { FuelEstimate } from "./journey-plan.js";

export type FuelInputs = {
  distanceKm: number;
  /** Rider's own figure wins over the catalogue's. */
  riderMileageKmpl: number | null;
  catalogueMileageKmpl: number | null;
  tankLitres: number | null;
  riderPricePerLitre: number | null;
  configuredPricePerLitre: number | null;
};

/**
 * Fuel for the route, per motorcycle: plain arithmetic on the routing distance,
 * a mileage the rider or the bike catalogue supplied, and a fuel price the rider
 * or the configuration supplied. Whatever is missing stays null: nothing here
 * is estimated or assumed.
 */
export function estimateFuel(inputs: FuelInputs): FuelEstimate {
  const mileageKmpl = inputs.riderMileageKmpl ?? inputs.catalogueMileageKmpl;
  const mileageSource =
    inputs.riderMileageKmpl !== null
      ? "rider"
      : inputs.catalogueMileageKmpl !== null
        ? "catalogue"
        : null;
  const pricePerLitre = inputs.riderPricePerLitre ?? inputs.configuredPricePerLitre;
  const priceSource =
    inputs.riderPricePerLitre !== null
      ? "rider"
      : inputs.configuredPricePerLitre !== null
        ? "configured"
        : null;

  const requiredLitres = mileageKmpl ? round(inputs.distanceKm / mileageKmpl, 1) : null;
  return {
    mileageKmpl,
    mileageSource,
    tankLitres: inputs.tankLitres,
    rangeKm: mileageKmpl && inputs.tankLitres ? Math.round(mileageKmpl * inputs.tankLitres) : null,
    requiredLitres,
    pricePerLitre,
    priceSource,
    estimatedCost:
      requiredLitres !== null && pricePerLitre !== null
        ? Math.round(requiredLitres * pricePerLitre)
        : null,
  };
}
