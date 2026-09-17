/**
 * Image uploads straight to object storage:
 *   1. ask the API for a pre-signed URL,
 *   2. PUT the file to storage (the API never receives the bytes),
 *   3. ask the API to verify it and mark it ready.
 */

import { ApiError, getApiClient } from "@/lib/api";
import type {
  ApiMediaAsset,
  ApiMediaCategory,
  ApiMediaMimeType,
  ApiUploadSession,
} from "@/lib/api";

export const ACCEPTED_IMAGE_TYPES: readonly ApiMediaMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export type UploadImageOptions = {
  category: ApiMediaCategory;
  altText?: string;
  signal?: AbortSignal;
};

export async function uploadImage(file: File, options: UploadImageOptions): Promise<ApiMediaAsset> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as ApiMediaMimeType)) {
    throw new ApiError({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "Choose a JPEG, PNG, WebP or AVIF image.",
    });
  }

  const api = getApiClient();
  const signal = options.signal ? { signal: options.signal } : {};

  const session = await api.request<ApiUploadSession>("/media/uploads", {
    method: "POST",
    body: {
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      category: options.category,
      ...(options.altText ? { altText: options.altText } : {}),
    },
    ...signal,
  });

  const stored = await fetch(session.upload.url, {
    method: session.upload.method,
    headers: session.upload.headers,
    body: file,
    ...signal,
  });
  if (!stored.ok) {
    throw new ApiError({
      status: stored.status,
      code: "MEDIA_UPLOAD_FAILED",
      message: "The image could not be uploaded. Please try again.",
    });
  }

  return api.request<ApiMediaAsset>(`/media/${session.asset.id}/complete`, {
    method: "POST",
    ...signal,
  });
}
