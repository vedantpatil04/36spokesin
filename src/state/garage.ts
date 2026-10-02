import { useCallback, useMemo } from "react";
import { fitsBike } from "@/lib/fitment";
import {
  addMyBike,
  listMyBikes,
  removeMyBike,
  setPrimaryBike,
  updateMyBike,
} from "@/services/garage";
import type { GarageBike, ID, OwnedBikeInput, Product } from "@/types";
import { assertSignedIn, type AppStores, type LoadStatus, useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

/** The motorcycle the visitor is shopping and planning for. Shared by Garage and Shop. */
export function useSelectedBikeId(): ID | null {
  const { garage } = useAppStores();
  return useStoreSelector(garage, (state) => state.selectedBikeId);
}

export function useSelectBike(): (bikeId: ID | null) => void {
  const { garage } = useAppStores();
  return useCallback(
    (bikeId: ID | null) => garage.setState((state) => ({ ...state, selectedBikeId: bikeId })),
    [garage],
  );
}

/**
 * Whether a product fits `bikeId`, or the selected bike when omitted. False
 * while no bike is chosen, so "Fits your bike" only appears once there is one.
 */
export function useProductFits(product: Product, bikeId?: ID): boolean {
  const selectedBikeId = useSelectedBikeId();
  const target = bikeId ?? selectedBikeId;
  return target !== null && fitsBike(product, target);
}

/** The signed-in rider's own bikes, primary first. */
export function useMyBikes(): GarageBike[] {
  const { garage } = useAppStores();
  return useStoreSelector(garage, (state) => state.myBikes);
}

export function useMyBikesStatus(): LoadStatus {
  const { garage } = useAppStores();
  return useStoreSelector(garage, (state) => state.myBikesStatus);
}

export function usePrimaryBike(): GarageBike | null {
  const { garage } = useAppStores();
  return useStoreSelector(garage, (state) => state.myBikes.find((bike) => bike.isPrimary) ?? null);
}

/** Stores the rider's bikes and, if nothing is selected yet, shops for their primary bike. */
export function setMyBikes(stores: AppStores, bikes: GarageBike[]): void {
  const sorted = [...bikes].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  stores.garage.setState((state) => ({
    ...state,
    myBikes: sorted,
    myBikesStatus: "ready",
    selectedBikeId: state.selectedBikeId ?? sorted[0]?.bikeId ?? null,
    revision: state.revision + 1,
  }));
}

/** My Garage changes go to the API; the list is then re-read so primary flags stay exact. */
export function useGarageActions() {
  const stores = useAppStores();
  return useMemo(() => {
    const reload = async () => {
      setMyBikes(stores, await listMyBikes());
    };
    const run = async <T>(request: () => Promise<T>): Promise<T> => {
      assertSignedIn(stores);
      const result = await request();
      await reload();
      return result;
    };
    return {
      add: (input: OwnedBikeInput) => run(() => addMyBike(input)),
      update: (id: ID, input: Partial<OwnedBikeInput>) => run(() => updateMyBike(id, input)),
      makePrimary: (id: ID) => run(() => setPrimaryBike(id)),
      remove: (id: ID) => run(() => removeMyBike(id)),
      refresh: () => run(async () => undefined),
    };
  }, [stores]);
}
