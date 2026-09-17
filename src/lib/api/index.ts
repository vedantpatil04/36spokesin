import { env } from "@/lib/env";
import { type ApiClient, createApiClient } from "./client";
import { createBrowserTokenStore } from "./token-store";

export { ApiError, createApiClient } from "./client";
export type { ApiClient, ApiClientOptions, RequestOptions } from "./client";
export type { AccessTokenStore } from "./token-store";
export type * from "./types";

let client: ApiClient | null = null;

/**
 * The app-wide API client. Throws when VITE_API_URL is not configured; check
 * `features.backend` from `@/lib/env` before calling from UI that must keep
 * working without a backend.
 */
export function getApiClient(): ApiClient {
  if (!env.apiUrl) {
    throw new Error("VITE_API_URL is not set, so the 36 Spokes API is not available.");
  }
  client ??= createApiClient({ baseUrl: env.apiUrl, tokens: createBrowserTokenStore() });
  return client;
}
