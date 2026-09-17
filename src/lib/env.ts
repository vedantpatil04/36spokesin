/**
 * Typed access to public configuration.
 *
 * Services are not connected in Phase 2: values are optional and the `features`
 * flags stay false until the matching variables are set. Server-only secrets
 * (Supabase service role, Razorpay key secret) must never be read here; they
 * belong in server functions from Phase 3 onward. See .env.example.
 */

const read = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const stripTrailingSlash = (value: string | null) => (value ? value.replace(/\/+$/, "") : null);

export const env = {
  siteUrl: stripTrailingSlash(read(import.meta.env.VITE_SITE_URL)),
  supabaseUrl: read(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: read(import.meta.env.VITE_SUPABASE_ANON_KEY),
  mapboxToken: read(import.meta.env.VITE_MAPBOX_TOKEN),
  razorpayKeyId: read(import.meta.env.VITE_RAZORPAY_KEY_ID),
} as const;

/** Which integrations have configuration. Nothing reads these until Phase 3. */
export const features = {
  backend: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  maps: Boolean(env.mapboxToken),
  payments: Boolean(env.razorpayKeyId),
} as const;
