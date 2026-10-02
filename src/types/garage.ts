import type { ID, ISODate, ISODateTime } from "./common";

export type SetupCheckStatus = "ready" | "missing";

/** One line of the trip-ready check for a rider's setup. */
export type SetupCheckItem = {
  label: string;
  status: SetupCheckStatus;
  note: string;
};

export type GarageService = {
  name: string;
  note: string;
};

/** A motorcycle registered to a rider's garage. */
export type OwnedBike = {
  id: ID;
  bikeId: ID;
  variantId: ID | null;
  variantName: string | null;
  nickname: string | null;
  year: number | null;
  odometerKm: number | null;
  isPrimary: boolean;
  /** The model has since been archived from the catalogue. */
  archived: boolean;
  addedAt: ISODateTime;
};

export type OwnedBikeInput = {
  bikeId: ID;
  variantId: ID | null;
  nickname: string | null;
  year: number | null;
  odometerKm: number | null;
  isPrimary?: boolean;
};

export type MaintenanceRecord = {
  id: ID;
  ownedBikeId: ID;
  date: ISODate;
  title: string;
  odometerKm: number;
  workshop?: string;
};
