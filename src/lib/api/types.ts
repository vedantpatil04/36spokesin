/**
 * Response shapes of the 36 Spokes API (backend/). These mirror the API's DTOs;
 * UI components should keep consuming `@/types` models, mapped inside services.
 */

import type { ISODateTime } from "@/types";

export type ApiUserRole = "RIDER" | "ADMIN";

export type ApiMediaCategory =
  | "RIDER"
  | "BIKE"
  | "PRODUCT"
  | "DESTINATION"
  | "TRIP"
  | "EVENT"
  | "STORY"
  | "GROUP"
  | "GARAGE_SERVICE"
  | "SITE";

export type ApiMediaStatus = "PENDING" | "READY";

export type ApiMediaMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  role: ApiUserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

/** Returned by register, login and refresh. Web clients never see the refresh token. */
export type ApiAuthSession = {
  user: ApiUser;
  accessToken: string;
  tokenType: "Bearer";
  /** Access token lifetime in seconds. */
  expiresIn: number;
};

export type ApiRiderProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  city: string | null;
  avatar: {
    id: string;
    url: string | null;
    width: number | null;
    height: number | null;
    altText: string | null;
  } | null;
  memberSince: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiMediaAsset = {
  id: string;
  /** Null until the upload has been completed. */
  url: string | null;
  category: ApiMediaCategory;
  status: ApiMediaStatus;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiUploadSession = {
  asset: ApiMediaAsset;
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresAt: ISODateTime;
  };
};

export type ApiErrorDetail = { field: string; messages: string[] };

export type ApiPageMeta = { nextCursor: string | null; limit: number };

export type ApiPage<T> = { items: T[]; meta: ApiPageMeta };
