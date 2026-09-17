import { randomUUID } from "node:crypto";
import type { MediaCategory } from "../generated/prisma/enums.js";
import {
  type AllowedMediaMimeType,
  MEDIA_CATEGORY_PREFIX,
  MEDIA_MIME_EXTENSIONS,
} from "./media.policy.js";

const SAFE_KEY_PATTERN = /^[a-z-]+\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/;

/**
 * Object keys are generated entirely on the server: category prefix, UTC year and
 * month, a random UUID and an extension derived from the validated MIME type.
 * Nothing the client sends (file name included) reaches the key, so path
 * traversal and overwriting other objects are impossible.
 */
export function buildStorageKey(
  category: MediaCategory,
  mimeType: AllowedMediaMimeType,
  now: Date = new Date(),
  id: string = randomUUID(),
): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const key = `${MEDIA_CATEGORY_PREFIX[category]}/${year}/${month}/${id}.${MEDIA_MIME_EXTENSIONS[mimeType]}`;
  if (!SAFE_KEY_PATTERN.test(key)) throw new Error("Generated storage key failed validation");
  return key;
}

export function isSafeStorageKey(key: string): boolean {
  return SAFE_KEY_PATTERN.test(key);
}

/**
 * A display-only version of the client's file name: directory components,
 * control characters and excess length removed. Never used as a path.
 */
export function sanitizeFileName(input: string): string {
  const base = input.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  return (cleaned || "upload").slice(0, 200);
}
