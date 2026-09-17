/**
 * Typed access to public configuration.
 *
 * Values are optional and the `features` flags stay false until the matching
 * variables are set. Server-only secrets must never be read here; they belong to
 * the API in backend/. See .env.example.
 */

const read = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const stripTrailingSlash = (value: string | null) => (value ? value.replace(/\/+$/, "") : null);

export const env = {
  siteUrl: stripTrailingSlash(read(import.meta.env.VITE_SITE_URL)),
  apiUrl: stripTrailingSlash(read(import.meta.env.VITE_API_URL)),
  mapboxToken: read(import.meta.env.VITE_MAPBOX_TOKEN),
  razorpayKeyId: read(import.meta.env.VITE_RAZORPAY_KEY_ID),
} as const;

/** Which integrations have configuration. */
export const features = {
  backend: Boolean(env.apiUrl),
  maps: Boolean(env.mapboxToken),
  payments: Boolean(env.razorpayKeyId),
} as const;
