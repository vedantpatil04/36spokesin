/**
 * One interface over every admin photo gallery (products, destinations, trips,
 * rides), so the CMS uses a single gallery editor. Each call persists at once
 * and returns the gallery as the API now has it.
 */

import { getApiClient } from "@/lib/api";
import type { ApiGalleryList, ApiMediaCategory, ApiProductImage } from "@/lib/api";
import {
  attachProductImage,
  removeProductImage,
  reorderProductImages,
  replaceProductImage,
  setPrimaryProductImage,
  updateProductImage,
} from "./catalog";

type Gallery = Promise<{ images: ApiProductImage[] }>;

export type GalleryApi = {
  /** Media category uploads for this gallery must use. */
  category: ApiMediaCategory;
  attach: (ownerId: string, body: { mediaAssetId: string; altText?: string | null }) => Gallery;
  update: (
    ownerId: string,
    imageId: string,
    body: { altText?: string | null; caption?: string | null },
  ) => Gallery;
  remove: (ownerId: string, imageId: string) => Gallery;
  reorder: (ownerId: string, imageIds: string[]) => Gallery;
  setPrimary: (ownerId: string, imageId: string) => Gallery;
  replace: (ownerId: string, imageId: string, mediaAssetId: string) => Gallery;
};

export const productGalleryApi: GalleryApi = {
  category: "PRODUCT",
  attach: attachProductImage,
  update: updateProductImage,
  remove: removeProductImage,
  reorder: reorderProductImages,
  setPrimary: setPrimaryProductImage,
  replace: replaceProductImage,
};

function contentGalleryApi(
  collection: "destinations" | "trips" | "rides",
  category: ApiMediaCategory,
): GalleryApi {
  const api = () => getApiClient();
  const base = (id: string) => `/admin/${collection}/${id}/images`;
  return {
    category,
    attach: (id, body) => api().request<ApiGalleryList>(base(id), { method: "POST", body }),
    update: (id, imageId, body) =>
      api().request<ApiGalleryList>(`${base(id)}/${imageId}`, { method: "PATCH", body }),
    remove: (id, imageId) =>
      api().request<ApiGalleryList>(`${base(id)}/${imageId}`, { method: "DELETE" }),
    reorder: (id, imageIds) =>
      api().request<ApiGalleryList>(`${base(id)}/reorder`, { method: "POST", body: { imageIds } }),
    setPrimary: (id, imageId) =>
      api().request<ApiGalleryList>(`${base(id)}/${imageId}/primary`, { method: "POST" }),
    replace: (id, imageId, mediaAssetId) =>
      api().request<ApiGalleryList>(`${base(id)}/${imageId}/replace`, {
        method: "POST",
        body: { mediaAssetId },
      }),
  };
}

export const destinationGalleryApi = contentGalleryApi("destinations", "DESTINATION");
export const tripGalleryApi = contentGalleryApi("trips", "TRIP");
export const rideGalleryApi = contentGalleryApi("rides", "RIDE");
