/** Admin CMS: founders, stories, rider spotlights and groups. Returns API shapes. */

import { getApiClient } from "@/lib/api";
import type {
  ApiAdminFounder,
  ApiAdminGroup,
  ApiAdminRiderSpotlight,
  ApiAdminStory,
  ApiContentStatus,
  ApiMediaAsset,
} from "@/lib/api";

const api = () => getApiClient();

export type FounderInput = {
  name: string;
  role: string | null;
  shortBio: string | null;
  story: string | null;
  quote: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  imageMediaId: string | null;
  status: ApiContentStatus;
};

export type StoryInput = {
  title: string;
  slug?: string;
  excerpt: string | null;
  content: string | null;
  authorName: string | null;
  coverMediaId: string | null;
  destinationId: string | null;
  featured: boolean;
  status: ApiContentStatus;
};

export type RiderSpotlightInput = {
  name: string;
  bike: string | null;
  location: string | null;
  favouriteRide: string | null;
  shortStory: string | null;
  imageMediaId: string | null;
  status: ApiContentStatus;
};

export type GroupInput = {
  name: string;
  slug?: string;
  description: string | null;
  region: string | null;
  rideCadence: string | null;
  memberCount: number | null;
  coverMediaId: string | null;
  status: ApiContentStatus;
};

/** The same five operations for every community resource. */
export type AdminResource<Row, Input> = {
  list: () => Promise<Row[]>;
  create: (input: Input) => Promise<Row>;
  update: (id: string, input: Partial<Input>) => Promise<Row>;
  archive: (id: string) => Promise<Row>;
  reorder: (ids: string[]) => Promise<Row[]>;
};

function resource<Row, Input>(path: string): AdminResource<Row, Input> {
  const base = `/admin/community/${path}`;
  return {
    list: () => api().request<Row[]>(base),
    create: (input: Input) => api().request<Row>(base, { method: "POST", body: input }),
    update: (id: string, input: Partial<Input>) =>
      api().request<Row>(`${base}/${id}`, { method: "PATCH", body: input }),
    archive: (id: string) => api().request<Row>(`${base}/${id}/archive`, { method: "POST" }),
    reorder: (ids: string[]) =>
      api().request<Row[]>(`${base}/reorder`, { method: "POST", body: { ids } }),
  };
}

export const adminFounders = resource<ApiAdminFounder, FounderInput>("founders");
export const adminStories = resource<ApiAdminStory, StoryInput>("stories");
export const adminRiderSpotlights = resource<ApiAdminRiderSpotlight, RiderSpotlightInput>("riders");
export const adminGroups = resource<ApiAdminGroup, GroupInput>("groups");

/** Alt text is stored on the image itself, so every page that shows it gets the same wording. */
export const updateImageAltText = (mediaAssetId: string, altText: string | null) =>
  api().request<ApiMediaAsset>(`/media/${mediaAssetId}`, {
    method: "PATCH",
    body: { altText },
  });
