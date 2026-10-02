import { getApiClient } from "@/lib/api";
import type { HeroSlide } from "@/types";

export type HeroSlideInput = {
  title: string;
  eyebrow?: string | null;
  description?: string | null;
  location?: string | null;
  mediaType?: "IMAGE" | "VIDEO";
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
  sortOrder?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type PathCardInput = {
  title?: string;
  tagline?: string | null;
  description?: string | null;
  ctaLabel?: string;
  destinationUrl?: string;
  badge?: string | null;
  imageUrl?: string | null;
  imageMediaId?: string | null;
  sortOrder?: number;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type AdminPathCard = {
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
  createdAt: string;
  updatedAt: string;
};

const api = () => getApiClient();

// ─── Hero Slides ────────────────────────────────────────────────────────────

export const listAdminHeroSlides = () =>
  api().request<HeroSlide[]>("/admin/site/hero-slides");

export const getAdminHeroSlide = (id: string) =>
  api().request<HeroSlide>(`/admin/site/hero-slides/${id}`);

export const createHeroSlide = (input: HeroSlideInput) =>
  api().request<HeroSlide>("/admin/site/hero-slides", {
    method: "POST",
    body: input,
  });

export const updateHeroSlide = (id: string, input: Partial<HeroSlideInput>) =>
  api().request<HeroSlide>(`/admin/site/hero-slides/${id}`, {
    method: "PATCH",
    body: input,
  });

export const archiveHeroSlide = (id: string) =>
  api().request<HeroSlide>(`/admin/site/hero-slides/${id}`, {
    method: "DELETE",
  });

export const reorderHeroSlides = (ids: string[]) =>
  api().request<HeroSlide[]>("/admin/site/hero-slides/reorder", {
    method: "PATCH",
    body: { ids },
  });

// ─── Path Cards ─────────────────────────────────────────────────────────────

export const listAdminPathCards = () =>
  api().request<AdminPathCard[]>("/admin/site/path-cards");

export const getAdminPathCard = (id: string) =>
  api().request<AdminPathCard>(`/admin/site/path-cards/${id}`);

export const updatePathCard = (id: string, input: PathCardInput) =>
  api().request<AdminPathCard>(`/admin/site/path-cards/${id}`, {
    method: "PATCH",
    body: input,
  });

export const reorderPathCards = (ids: string[]) =>
  api().request<AdminPathCard[]>("/admin/site/path-cards/reorder", {
    method: "PATCH",
    body: { ids },
  });
