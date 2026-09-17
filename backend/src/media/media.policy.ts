import { MediaCategory, UserRole } from "../generated/prisma/enums.js";

/**
 * Upload rules in one place. Adding a format, a category or a staff role that may
 * upload is a change to this file only.
 */

/** Accepted image formats and the file extension used in storage keys. SVG is excluded (scriptable). */
export const MEDIA_MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type AllowedMediaMimeType = keyof typeof MEDIA_MIME_EXTENSIONS;

export const ALLOWED_MEDIA_MIME_TYPES = Object.keys(
  MEDIA_MIME_EXTENSIONS,
) as AllowedMediaMimeType[];

export function isAllowedMimeType(value: string): value is AllowedMediaMimeType {
  return Object.hasOwn(MEDIA_MIME_EXTENSIONS, value);
}

/** Top-level storage prefix per category, e.g. `products/2026/09/<uuid>.webp`. */
export const MEDIA_CATEGORY_PREFIX: Record<MediaCategory, string> = {
  [MediaCategory.RIDER]: "riders",
  [MediaCategory.BIKE]: "bikes",
  [MediaCategory.PRODUCT]: "products",
  [MediaCategory.DESTINATION]: "destinations",
  [MediaCategory.TRIP]: "trips",
  [MediaCategory.EVENT]: "events",
  [MediaCategory.STORY]: "stories",
  [MediaCategory.GROUP]: "groups",
  [MediaCategory.GARAGE_SERVICE]: "garage-services",
  [MediaCategory.SITE]: "site",
};

/**
 * Roles (besides ADMIN, which may upload anything) allowed to start uploads per
 * category. Riders can upload their own profile media today; later phases open
 * BIKE, STORY and GROUP to riders and editorial categories to staff roles.
 */
export const MEDIA_UPLOAD_ROLES: Record<MediaCategory, readonly UserRole[]> = {
  [MediaCategory.RIDER]: [UserRole.RIDER],
  [MediaCategory.BIKE]: [],
  [MediaCategory.PRODUCT]: [],
  [MediaCategory.DESTINATION]: [],
  [MediaCategory.TRIP]: [],
  [MediaCategory.EVENT]: [],
  [MediaCategory.STORY]: [],
  [MediaCategory.GROUP]: [],
  [MediaCategory.GARAGE_SERVICE]: [],
  [MediaCategory.SITE]: [],
};

export function canUploadCategory(role: UserRole, category: MediaCategory): boolean {
  return role === UserRole.ADMIN || MEDIA_UPLOAD_ROLES[category].includes(role);
}

/** Bytes read from the start of an upload to verify its format and dimensions. */
export const MEDIA_INSPECTION_BYTES = 128 * 1024;
