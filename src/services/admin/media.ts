/** Admin CMS: the catalogue media library and cleanup of unused files. */

import { getApiClient } from "@/lib/api";
import type { ApiAdminMediaAsset, ApiMediaCategory, ApiPage } from "@/lib/api";

export function listMediaLibrary(query: {
  category?: ApiMediaCategory | undefined;
  unused?: boolean;
  cursor?: string | null;
}): Promise<ApiPage<ApiAdminMediaAsset>> {
  return getApiClient().requestPage<ApiAdminMediaAsset>("/admin/media", {
    query: {
      category: query.category,
      unused: query.unused ? true : undefined,
      cursor: query.cursor ?? undefined,
      limit: 48,
    },
  });
}

/** Refused with 409 MEDIA_IN_USE while any record still uses the file. */
export const deleteMediaAsset = (id: string) =>
  getApiClient().request<void>(`/admin/media/${id}`, { method: "DELETE" });
