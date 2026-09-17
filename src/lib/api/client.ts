/**
 * Minimal, dependency-free client for the 36 Spokes API.
 *
 * - Unwraps the API envelope: `{ data }` → data, `{ data, meta }` → { items, meta }.
 * - Throws `ApiError` with the API's stable `code` for every failure.
 * - Sends the access token and, on a 401, refreshes once (cookie-based) and retries.
 *   Concurrent 401s share a single refresh.
 *
 * Framework-agnostic on purpose: no router, React or Vite imports, so it can be
 * reused by server code, tests and a future mobile client.
 */

import type { AccessTokenStore } from "./token-store";
import { createMemoryTokenStore } from "./token-store";
import type { ApiAuthSession, ApiErrorDetail, ApiPage, ApiPageMeta } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly requestId: string | null;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.requestId = init.requestId ?? null;
  }

  /** Messages for one form field, for inline validation display. */
  fieldMessages(field: string): string[] {
    return this.details.find((detail) => detail.field === field)?.messages ?? [];
  }
}

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Send the access token and refresh on 401. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
};

export type ApiClientOptions = {
  /** Includes the version, e.g. http://localhost:3000/api/v1 */
  baseUrl: string;
  tokens?: AccessTokenStore;
  fetch?: typeof fetch;
  /** Called when a refresh fails, i.e. the visitor is now signed out. */
  onSessionExpired?: () => void;
};

export type ApiClient = {
  readonly tokens: AccessTokenStore;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  requestPage<T>(path: string, options?: RequestOptions): Promise<ApiPage<T>>;
  /** Exchanges the refresh cookie for a new access token. Null when signed out. */
  refreshSession(): Promise<ApiAuthSession | null>;
};

type Envelope = { data?: unknown; meta?: ApiPageMeta; error?: Partial<ApiErrorBody> };
type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details: ApiErrorDetail[];
  requestId: string;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const tokens = options.tokens ?? createMemoryTokenStore();
  const doFetch = options.fetch ?? ((input, init) => fetch(input, init));
  let refreshInFlight: Promise<ApiAuthSession | null> | null = null;

  async function send(path: string, requestOptions: RequestOptions, withToken: boolean) {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (requestOptions.body !== undefined) headers["Content-Type"] = "application/json";
    const token = withToken ? tokens.get() : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const init: RequestInit = {
      method: requestOptions.method ?? "GET",
      headers,
      // The refresh cookie is scoped to /auth routes; including credentials is harmless elsewhere.
      credentials: "include",
    };
    if (requestOptions.body !== undefined) init.body = JSON.stringify(requestOptions.body);
    if (requestOptions.signal) init.signal = requestOptions.signal;

    try {
      return await doFetch(buildUrl(baseUrl, path, requestOptions.query), init);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new ApiError({
        status: 0,
        code: "NETWORK_ERROR",
        message: "Could not reach the 36 Spokes API. Check your connection and try again.",
      });
    }
  }

  async function execute(
    path: string,
    requestOptions: RequestOptions,
  ): Promise<Envelope | undefined> {
    const useAuth = requestOptions.auth ?? true;
    let response = await send(path, requestOptions, useAuth);

    if (response.status === 401 && useAuth && tokens.get() !== null && !path.startsWith("/auth/")) {
      const session = await refreshSession();
      if (session) response = await send(path, requestOptions, true);
    }

    return parse(response);
  }

  function refreshSession(): Promise<ApiAuthSession | null> {
    refreshInFlight ??= (async () => {
      try {
        const envelope = await parse(await send("/auth/refresh", { method: "POST" }, false));
        const session = envelope?.data as ApiAuthSession;
        tokens.set(session.accessToken);
        return session;
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          const wasSignedIn = tokens.get() !== null;
          tokens.set(null);
          if (wasSignedIn) options.onSessionExpired?.();
          return null;
        }
        throw error;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  return {
    tokens,
    refreshSession,
    async request<T>(path: string, requestOptions: RequestOptions = {}): Promise<T> {
      const envelope = await execute(path, requestOptions);
      return envelope?.data as T;
    },
    async requestPage<T>(path: string, requestOptions: RequestOptions = {}): Promise<ApiPage<T>> {
      const envelope = await execute(path, requestOptions);
      return {
        items: (envelope?.data as T[] | undefined) ?? [],
        meta: envelope?.meta ?? { nextCursor: null, limit: 0 },
      };
    },
  };
}

function buildUrl(baseUrl: string, path: string, query: Record<string, QueryValue> | undefined) {
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function parse(response: Response): Promise<Envelope | undefined> {
  if (response.status === 204) return undefined;

  let body: Envelope | undefined;
  try {
    body = (await response.json()) as Envelope;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const error = body?.error;
    throw new ApiError({
      status: response.status,
      code: error?.code ?? "UNKNOWN_ERROR",
      message: error?.message ?? `Request failed with status ${response.status}.`,
      details: error?.details ?? [],
      requestId: error?.requestId ?? response.headers.get("x-request-id"),
    });
  }
  return body;
}
