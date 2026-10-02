/**
 * The signed-in rider's own motorcycles ("My Garage"), stored by the API.
 * Browser only: these requests need the rider's access token.
 */

import { getApiClient } from "@/lib/api";
import type { ApiRiderBike } from "@/lib/api";
import type { GarageBike, ID, OwnedBikeInput } from "@/types";
import { toGarageBike } from "./catalog-mappers";

const toBody = (input: Partial<OwnedBikeInput>) => ({
  ...(input.bikeId !== undefined ? { bikeModelId: input.bikeId } : {}),
  ...(input.variantId !== undefined ? { bikeVariantId: input.variantId } : {}),
  ...(input.nickname !== undefined ? { nickname: input.nickname } : {}),
  ...(input.year !== undefined ? { year: input.year } : {}),
  ...(input.odometerKm !== undefined ? { odometerKm: input.odometerKm } : {}),
  ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
});

export async function listMyBikes(): Promise<GarageBike[]> {
  return (await getApiClient().request<ApiRiderBike[]>("/my-bikes")).map(toGarageBike);
}

export async function addMyBike(input: OwnedBikeInput): Promise<GarageBike> {
  return toGarageBike(
    await getApiClient().request<ApiRiderBike>("/my-bikes", {
      method: "POST",
      body: toBody(input),
    }),
  );
}

export async function updateMyBike(id: ID, input: Partial<OwnedBikeInput>): Promise<GarageBike> {
  return toGarageBike(
    await getApiClient().request<ApiRiderBike>(`/my-bikes/${id}`, {
      method: "PATCH",
      body: toBody(input),
    }),
  );
}

export async function setPrimaryBike(id: ID): Promise<GarageBike> {
  return toGarageBike(
    await getApiClient().request<ApiRiderBike>(`/my-bikes/${id}/primary`, { method: "POST" }),
  );
}

export async function removeMyBike(id: ID): Promise<void> {
  await getApiClient().request<void>(`/my-bikes/${id}`, { method: "DELETE" });
}
