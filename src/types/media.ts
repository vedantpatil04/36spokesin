/**
 * Replaceable media.
 *
 * Every image in the app is described by a MediaAsset rather than a bare URL, so
 * Phase 7 can swap local placeholders for CDN images (with srcset and art
 * direction) without touching components.
 */

/** Where an asset belongs. Mirrors the storage layout planned for production media. */
export type MediaCategory =
  | "brand"
  | "bikes"
  | "products"
  | "destinations"
  | "trips"
  | "riders"
  | "stories"
  | "events"
  | "garage"
  | "site";

/** Point of interest as fractions of width and height (0–1). Drives `object-position`. */
export type FocalPoint = {
  x: number;
  y: number;
};

export type MediaAsset = {
  src: string;
  /** Describes the image itself. Components may override it with entity-specific text. */
  alt: string;
  /** Intrinsic pixel size of `src`. Rendered as width/height to reserve layout space. */
  width: number;
  height: number;
  category: MediaCategory;
  focalPoint?: FocalPoint;
  /** Responsive candidates, e.g. `"/img/ladakh-640.jpg 640w, /img/ladakh-1280.jpg 1280w"`. */
  srcSet?: string;
};
