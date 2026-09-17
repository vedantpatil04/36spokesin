/// <reference types="vite/client" />

/**
 * Public, build-time environment variables. Only `VITE_*` values reach the
 * browser, so never put secrets here. Read them through src/lib/env.ts.
 */
interface ImportMetaEnv {
  /** Absolute origin used for canonical URLs and social images, e.g. https://36spokes.in */
  readonly VITE_SITE_URL?: string;
  /** 36 Spokes API base URL including the version, e.g. http://localhost:3000/api/v1 */
  readonly VITE_API_URL?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
