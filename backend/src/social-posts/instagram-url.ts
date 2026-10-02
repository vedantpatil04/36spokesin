import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { SocialMediaType } from "../generated/prisma/enums.js";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "igsh",
  "igshid",
  "fbclid",
  "ref",
]);

/**
 * Validates that a string is a supported Instagram post or reel URL.
 * Accepts:
 * - https://www.instagram.com/p/{id}
 * - https://www.instagram.com/reel/{id}
 * - https://instagram.com/p/{id}
 * - https://instagram.com/reel/{id}
 * (and /reels/)
 */
export function isValidInstagramUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host !== "instagram.com" &&
      host !== "www.instagram.com" &&
      host !== "m.instagram.com"
    ) {
      return false;
    }
    const pathMatch = parsed.pathname.match(/^\/(p|reel|reels)\/([A-Za-z0-9_-]+)/i);
    return Boolean(pathMatch);
  } catch {
    return false;
  }
}

/**
 * Normalizes an Instagram URL:
 * - Ensures https://www.instagram.com
 * - Standardizes /reels/ to /reel/
 * - Normalizes path to /(p|reel)/{id}/
 * - Strips harmless tracking parameters (utm_*, igsh*, fbclid) while preserving safe query tokens.
 */
export function normalizeInstagramUrl(rawUrl: string): string {
  if (!isValidInstagramUrl(rawUrl)) return rawUrl.trim();
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.protocol = "https:";
    parsed.hostname = "www.instagram.com";

    const pathMatch = parsed.pathname.match(/^\/(p|reel|reels)\/([A-Za-z0-9_-]+)/i);
    if (pathMatch) {
      const type = pathMatch[1].toLowerCase() === "reels" ? "reel" : pathMatch[1].toLowerCase();
      const id = pathMatch[2];
      parsed.pathname = `/${type}/${id}/`;
    }

    // Delete known tracking parameters
    const toDelete: string[] = [];
    for (const key of parsed.searchParams.keys()) {
      const lower = key.toLowerCase();
      if (TRACKING_PARAMS.has(lower) || lower.startsWith("utm_") || lower.startsWith("igsh")) {
        toDelete.push(key);
      }
    }
    for (const key of toDelete) {
      parsed.searchParams.delete(key);
    }

    // Construct clean URL
    const search = parsed.searchParams.toString();
    const cleanSearch = search ? `?${decodeURIComponent(search)}` : "";
    return `${parsed.origin}${parsed.pathname}${cleanSearch}`;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Automatically infers mediaType (VIDEO for reel, IMAGE for post) from the URL.
 */
export function inferMediaTypeFromInstagramUrl(rawUrl: string): SocialMediaType {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.pathname.match(/^\/(reel|reels)\//i)) {
      return SocialMediaType.VIDEO;
    }
  } catch {
    // fallback
  }
  return SocialMediaType.IMAGE;
}

@ValidatorConstraint({ name: "isInstagramPostUrl", async: false })
export class IsInstagramPostUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== "string") return false;
    return isValidInstagramUrl(value);
  }

  defaultMessage(): string {
    return "postUrl must be a valid Instagram post or reel URL (e.g. https://www.instagram.com/p/... or https://www.instagram.com/reel/...)";
  }
}

export function IsInstagramPostUrl(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInstagramPostUrlConstraint,
    });
  };
}
