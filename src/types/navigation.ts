import type { MediaAsset } from "./media";

export type PillarId = "garage" | "shop" | "travel" | "rides" | "community";

export type PillarRoute = "/garage" | "/shop" | "/travel" | "/rides" | "/community";

/** Homepage gateway into one of the five 36 Spokes pillars. */
export type Pillar = {
  id: PillarId;
  name: string;
  tagline: string;
  cta: string;
  to: PillarRoute;
  image: MediaAsset;
};
