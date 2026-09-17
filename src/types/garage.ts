import type { ID, ISODate } from "./common";

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
  odometerKm: number;
  serviceDueInKm: number;
};

export type MaintenanceRecord = {
  id: ID;
  ownedBikeId: ID;
  date: ISODate;
  title: string;
  odometerKm: number;
  workshop?: string;
};
