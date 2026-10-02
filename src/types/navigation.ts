import type { MediaAsset } from "./media";

export type PillarId = "rides" | "plan" | "shop" | "garage" | "community" | "travel";

export type PillarRoute = "/rides" | "/plan" | "/shop" | "/garage" | "/community" | "/travel";

/** Homepage gateway into one of the 36 Spokes paths. */
export type Pillar = {
  id: PillarId;
  name: string;
  tagline: string;
  description?: string | null | undefined;
  cta: string;
  to: PillarRoute;
  badge?: string | null | undefined;
  image: MediaAsset;
};

export type HeroMediaType = "IMAGE" | "VIDEO";
export type HeroAutoAdvanceMode = "FIXED_DURATION" | "VIDEO_END";

export type HeroSlide = {
  id: string;
  title: string;
  eyebrow?: string | null | undefined;
  description?: string | null | undefined;
  location?: string | null | undefined;
  mediaType: HeroMediaType;
  imageUrl?: string | null | undefined;
  videoUrl?: string | null | undefined;
  posterUrl?: string | null | undefined;
  mobileUrl?: string | null | undefined;
  imageMediaId?: string | null | undefined;
  videoMediaId?: string | null | undefined;
  posterMediaId?: string | null | undefined;
  mobileMediaId?: string | null | undefined;
  ctaLabel?: string | null | undefined;
  ctaUrl?: string | null | undefined;
  secondaryCtaLabel?: string | null | undefined;
  secondaryCtaUrl?: string | null | undefined;
  durationSeconds?: number | undefined;
  autoAdvanceMode?: HeroAutoAdvanceMode | undefined;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  image?: MediaAsset | null | undefined;
};
