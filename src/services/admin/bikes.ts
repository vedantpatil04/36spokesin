/** Admin CMS: bike brands, models and variants. Returns API shapes; see ./catalog.ts. */

import { getApiClient } from "@/lib/api";
import type { ApiAdminBikeModel, ApiBikeBrand, ApiBikeSegment } from "@/lib/api";

export type BikeModelInput = {
  brandId: string;
  name: string;
  slug?: string;
  segment: ApiBikeSegment;
  description: string | null;
  displacementCc: number | null;
  fuelEfficiencyKmpl: number | null;
  tankLitres: number | null;
  imageMediaId?: string | null;
  variants?: string[];
};

const api = () => getApiClient();

export const listBikeBrands = () => api().request<ApiBikeBrand[]>("/admin/bike-brands");

export const createBikeBrand = (input: { name: string; slug?: string }) =>
  api().request<ApiBikeBrand>("/admin/bike-brands", { method: "POST", body: input });

export const updateBikeBrand = (id: string, input: { name?: string; archived?: boolean }) =>
  api().request<ApiBikeBrand>(`/admin/bike-brands/${id}`, { method: "PATCH", body: input });

export const listAdminBikes = () => api().request<ApiAdminBikeModel[]>("/admin/bikes");

export const createBikeModel = (input: BikeModelInput) =>
  api().request<ApiAdminBikeModel>("/admin/bikes", { method: "POST", body: input });

export const updateBikeModel = (
  id: string,
  input: Partial<Omit<BikeModelInput, "variants">> & { archived?: boolean },
) => api().request<ApiAdminBikeModel>(`/admin/bikes/${id}`, { method: "PATCH", body: input });

export const createBikeVariant = (modelId: string, input: { name: string }) =>
  api().request<ApiAdminBikeModel>(`/admin/bikes/${modelId}/variants`, {
    method: "POST",
    body: input,
  });

export const updateBikeVariant = (
  modelId: string,
  variantId: string,
  input: { name?: string; archived?: boolean },
) =>
  api().request<ApiAdminBikeModel>(`/admin/bikes/${modelId}/variants/${variantId}`, {
    method: "PATCH",
    body: input,
  });
