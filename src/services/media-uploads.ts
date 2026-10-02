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

export const ACCEPTED_VIDEO_TYPES: readonly string[] = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

/** Mirrors the API's default MEDIA_MAX_UPLOAD_BYTES; the API remains the authority. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type UploadImageOptions = {
  category: ApiMediaCategory;
  altText?: string;
  signal?: AbortSignal;
  /** 0–1 while the bytes go to storage. Uses XHR, because fetch cannot report upload progress. */
  onProgress?: (fraction: number) => void;
};

export type UploadMediaOptions = UploadImageOptions;

/** Client-side check before anything is sent. Returns a message, or null when the file is acceptable. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as ApiMediaMimeType)) {
    return `${file.name}: choose a JPEG, PNG, WebP or AVIF image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `${file.name}: images must be ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB or smaller.`;
  }
  return null;
}

export function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return `${file.name}: choose an MP4, WebM or QuickTime (.mov) video.`;
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return `${file.name}: videos must be ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB or smaller.`;
  }
  return null;
}

export function validateMediaFile(file: File): string | null {
  if (file.type.startsWith("video/")) return validateVideoFile(file);
  return validateImageFile(file);
}

export async function uploadMedia(file: File, options: UploadMediaOptions): Promise<ApiMediaAsset> {
  const invalid = validateMediaFile(file);
  if (invalid) {
    throw new ApiError({ status: 400, code: "VALIDATION_FAILED", message: invalid });
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

  const status = options.onProgress
    ? await putWithProgress(session.upload, file, options.onProgress, options.signal)
    : (
        await fetch(session.upload.url, {
          method: session.upload.method,
          headers: session.upload.headers,
          body: file,
          ...signal,
        })
      ).status;

  if (status < 200 || status >= 300) {
    throw new ApiError({
      status,
      code: "MEDIA_UPLOAD_FAILED",
      message: "The media file could not be uploaded. Please try again.",
    });
  }

  return api.request<ApiMediaAsset>(`/media/${session.asset.id}/complete`, {
    method: "POST",
    ...signal,
  });
}

export async function uploadImage(file: File, options: UploadImageOptions): Promise<ApiMediaAsset> {
  const invalid = validateImageFile(file);
  if (invalid) {
    throw new ApiError({ status: 400, code: "VALIDATION_FAILED", message: invalid });
  }
  return uploadMedia(file, options);
}

export async function uploadVideo(file: File, options: UploadMediaOptions): Promise<ApiMediaAsset> {
  const invalid = validateVideoFile(file);
  if (invalid) {
    throw new ApiError({ status: 400, code: "VALIDATION_FAILED", message: invalid });
  }
  return uploadMedia(file, options);
}

function putWithProgress(
  upload: ApiUploadSession["upload"],
  file: File,
  onProgress: (fraction: number) => void,
  signal: AbortSignal | undefined,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upload.method, upload.url);
    for (const [name, value] of Object.entries(upload.headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      onProgress(1);
      resolve(xhr.status);
    };
    xhr.onerror = () =>
      reject(
        new ApiError({
          status: 0,
          code: "MEDIA_UPLOAD_FAILED",
          message: "The image could not reach storage. Check your connection and try again.",
        }),
      );
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    if (signal) {
      if (signal.aborted) {
        reject(new DOMException("Upload cancelled", "AbortError"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}
