export const JWT_ISSUER = "36spokes-api";
export const JWT_AUDIENCE = "36spokes-clients";

/** httpOnly cookie carrying the web refresh token. Scoped to the auth routes only. */
export const REFRESH_COOKIE_NAME = "spokes_rt";
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

/**
 * Native apps (Expo) cannot rely on cookies. They send this header with the value
 * `native` and receive the refresh token in the response body instead.
 */
export const CLIENT_PLATFORM_HEADER = "x-client-platform";
export const NATIVE_CLIENT_PLATFORM = "native";

/**
 * A just-rotated refresh token presented again within this window is treated as a
 * benign race (e.g. two tabs refreshing at once): it is rejected but the session
 * is kept. Outside the window it is treated as theft and the session is revoked.
 */
export const REFRESH_REUSE_GRACE_MS = 30_000;

export const IS_PUBLIC_KEY = "auth:isPublic";
export const ROLES_KEY = "auth:roles";
export const AUTH_RATE_LIMIT_KEY = "auth:rateLimit";
