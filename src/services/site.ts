import { garageServices, setupChecklist } from "@/data/garage";
import { defaultHeroSlides } from "@/data/hero-slides";
import { pillars as defaultPillars } from "@/data/pillars";
import { getApiClient } from "@/lib/api";
import { features } from "@/lib/env";
import type {
  GarageService,
  HeroSlide,
  Pillar,
  PillarId,
  PillarRoute,
  SetupCheckItem,
} from "@/types";

type ApiHeroSlide = {
  id: string;
  title: string;
  eyebrow?: string | null;
  description?: string | null;
  location?: string | null;
  mediaType: "IMAGE" | "VIDEO";
  imageUrl?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  mobileUrl?: string | null;
  imageMediaId?: string | null;
  videoMediaId?: string | null;
  posterMediaId?: string | null;
  mobileMediaId?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaUrl?: string | null;
  durationSeconds?: number;
  autoAdvanceMode?: "FIXED_DURATION" | "VIDEO_END";
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

type ApiPathCard = {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  ctaLabel: string;
  destinationUrl: string;
  badge?: string | null;
  imageUrl?: string | null;
  imageMediaId?: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export async function listHeroSlides(): Promise<HeroSlide[]> {
  if (!features.backend) return [...defaultHeroSlides];

  try {
    const apiSlides = await getApiClient().request<ApiHeroSlide[]>("/site/hero-slides", {
      auth: false,
    });
    if (!apiSlides || apiSlides.length === 0) return [...defaultHeroSlides];

    return apiSlides.map((s, idx) => {
      const fallback = defaultHeroSlides[idx % defaultHeroSlides.length] ?? defaultHeroSlides[0]!;
      return {
        id: s.id,
        title: s.title,
        eyebrow: s.eyebrow ?? undefined,
        description: s.description ?? undefined,
        location: s.location ?? undefined,
        mediaType: s.mediaType,
        imageUrl: s.imageUrl ?? fallback.imageUrl ?? fallback.image?.src ?? null,
        videoUrl: s.videoUrl ?? undefined,
        posterUrl: s.posterUrl ?? fallback.imageUrl ?? fallback.image?.src ?? null,
        mobileUrl: s.mobileUrl ?? undefined,
        imageMediaId: s.imageMediaId ?? undefined,
        videoMediaId: s.videoMediaId ?? undefined,
        posterMediaId: s.posterMediaId ?? undefined,
        mobileMediaId: s.mobileMediaId ?? undefined,
        ctaLabel: s.ctaLabel ?? undefined,
        ctaUrl: s.ctaUrl ?? undefined,
        secondaryCtaLabel: s.secondaryCtaLabel ?? undefined,
        secondaryCtaUrl: s.secondaryCtaUrl ?? undefined,
        durationSeconds: s.durationSeconds ?? 5,
        autoAdvanceMode: s.autoAdvanceMode ?? "FIXED_DURATION",
        sortOrder: s.sortOrder,
        status: s.status,
        image: fallback.image ?? null,
      };
    });
  } catch (error) {
    console.warn("Could not load hero slides from API, using defaults:", error);
    return [...defaultHeroSlides];
  }
}

export async function listPillars(): Promise<Pillar[]> {
  if (!features.backend) return [...defaultPillars];

  try {
    const apiCards = await getApiClient().request<ApiPathCard[]>("/site/path-cards", {
      auth: false,
    });
    if (!apiCards || apiCards.length === 0) return [...defaultPillars];

    return apiCards.map((c) => {
      const fallback = defaultPillars.find((p) => p.id === c.slug) ?? defaultPillars[0]!;
      return {
        id: c.slug as PillarId,
        name: c.title,
        tagline: c.tagline ?? fallback.tagline,
        description: c.description ?? fallback.description ?? undefined,
        cta: c.ctaLabel || fallback.cta,
        to: (c.destinationUrl as PillarRoute) || fallback.to,
        badge: c.badge ?? fallback.badge ?? undefined,
        image: c.imageUrl
          ? {
              src: c.imageUrl,
              alt: c.title,
              width: fallback.image.width,
              height: fallback.image.height,
              category: "site",
            }
          : fallback.image,
      };
    });
  } catch (error) {
    console.warn("Could not load path cards from API, using defaults:", error);
    return [...defaultPillars];
  }
}

export async function listGarageServices(): Promise<GarageService[]> {
  return [...garageServices];
}

/** Sample check. Phase 3 computes it per rider from their registered gear. */
export async function getSetupChecklist(): Promise<SetupCheckItem[]> {
  return [...setupChecklist];
}
