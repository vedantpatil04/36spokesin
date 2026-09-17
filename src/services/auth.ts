/**
 * Rider accounts, backed by the 36 Spokes API. Used by the Login and Join
 * routes, the Navbar and the `/my-36-spokes` guard (see `@/state/auth`).
 */

import { ApiError, getApiClient } from "@/lib/api";
import type { ApiAuthSession, ApiRiderProfile, ApiUser } from "@/lib/api";

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
};

export async function register(input: RegisterInput): Promise<ApiAuthSession> {
  const api = getApiClient();
  const session = await api.request<ApiAuthSession>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
  api.tokens.set(session.accessToken);
  return session;
}

export async function login(email: string, password: string): Promise<ApiAuthSession> {
  const api = getApiClient();
  const session = await api.request<ApiAuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  api.tokens.set(session.accessToken);
  return session;
}

/** Ends the session on the server and forgets the access token. */
export async function logout(): Promise<void> {
  const api = getApiClient();
  try {
    await api.request<void>("/auth/logout", { method: "POST", auth: false });
  } finally {
    api.tokens.set(null);
  }
}

/** Call once on app start in the browser. Returns the session, or null if signed out. */
export function restoreSession(): Promise<ApiAuthSession | null> {
  return getApiClient().refreshSession();
}

export function getCurrentUser(): Promise<ApiUser> {
  return getApiClient().request<ApiUser>("/users/me");
}

export function getRiderProfile(): Promise<ApiRiderProfile> {
  return getApiClient().request<ApiRiderProfile>("/riders/me");
}

/** A message safe to show under a form: field-level details when present, else the API's own message. */
export function describeAuthError(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessages = error.details.flatMap((detail) => detail.messages);
    if (fieldMessages.length > 0) return fieldMessages.join(" ");
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
