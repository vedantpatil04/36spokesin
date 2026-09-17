import { useCallback } from "react";
import type { ID, Product } from "@/types";
import { fitsBike } from "@/lib/fitment";
import { useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

/** The motorcycle the visitor is shopping and planning for. Shared by Garage and Shop. */
export function useSelectedBikeId(): ID {
  const { garage } = useAppStores();
  return useStoreSelector(garage, (state) => state.selectedBikeId);
}

export function useSelectBike(): (bikeId: ID) => void {
  const { garage } = useAppStores();
  return useCallback(
    (bikeId: ID) => garage.setState((state) => ({ ...state, selectedBikeId: bikeId })),
    [garage],
  );
}

/** Whether a product fits `bikeId`, or the selected bike when omitted. */
export function useProductFits(product: Product, bikeId?: ID): boolean {
  const selectedBikeId = useSelectedBikeId();
  return fitsBike(product, bikeId ?? selectedBikeId);
}
