/** API → UI mapping for the community pages. Images may be absent; text may be null. */

import { media } from "@/data/media";
import type {
  ApiFounder,
  ApiGroup,
  ApiImage,
  ApiRiderSpotlight,
  ApiStoryDetail,
  ApiStorySummary,
} from "@/lib/api";
import type { Founder, Group, MediaAsset, MediaCategory, RiderSpotlight, Story } from "@/types";
import { toMediaAsset } from "./catalog-mappers";

/** The uploaded image, or the 36-spoke wheel when there isn't one (or storage is off). */
function imageOrPlaceholder(
  image: ApiImage | null,
  category: MediaCategory,
  name: string,
  placeholder: MediaAsset,
) {
  const asset = toMediaAsset(image, category, name);
  return {
    image: asset ?? ({ ...placeholder, alt: placeholder.alt || "", category } satisfies MediaAsset),
    hasImage: asset !== null || placeholder !== media.placeholders.product,
  };
}

const istDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** ISO instant → `YYYY-MM-DD` in India time; "" when unknown. */
const toIstDate = (iso: string | null) => (iso ? istDate.format(new Date(iso)) : "");

/** Editor-written text → paragraphs (blank lines separate them). */
export const toParagraphs = (text: string | null) =>
  (text ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export function toFounder(api: ApiFounder): Founder {
  const asset = toMediaAsset(api.image, "community", `Portrait of ${api.name}`);

  return {
    id: api.id,
    name: api.name,
    role: api.role ?? "Founder",
    shortBio: api.shortBio,
    story: api.story,
    quote: api.quote,
    instagramUrl: api.instagramUrl,
    linkedinUrl: api.linkedinUrl,
    image: asset ?? ({ ...media.placeholders.product, alt: "", category: "community" }),
    hasImage: asset !== null,
  };
}

export function toStory(api: ApiStorySummary): Story {
  return {
    id: api.id,
    slug: api.slug,
    title: api.title,
    rider: api.authorName,
    destination: api.destination?.name ?? null,
    destinationSlug: api.destination?.slug ?? null,
    publishedAt: toIstDate(api.publishedAt),
    readMinutes: api.readMinutes,
    excerpt: api.excerpt,
    body: [],
    featured: api.featured,
    ...imageOrPlaceholder(api.cover, "stories", api.title, media.placeholders.bike),
  };
}

export function toStoryDetail(api: ApiStoryDetail): Story {
  return { ...toStory(api), body: toParagraphs(api.content) };
}

export function toRiderSpotlight(api: ApiRiderSpotlight): RiderSpotlight {
  return {
    id: api.id,
    name: api.name,
    bike: api.bike,
    location: api.location,
    favouriteRide: api.favouriteRide,
    shortStory: api.shortStory,
    ...imageOrPlaceholder(
      api.image,
      "community",
      `Portrait of ${api.name}`,
      media.placeholders.product,
    ),
  };
}

export function toGroup(api: ApiGroup): Group {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    city: api.region,
    description: api.description,
    memberCount: api.memberCount,
    rideCadence: api.rideCadence,
    ...imageOrPlaceholder(api.cover, "community", api.name, media.placeholders.bike),
  };
}
