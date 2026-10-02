/**
 * Community content. Founders, stories, rider spotlights and groups come from
 * the 36 Spokes API (public endpoints, safe in SSR loaders); community events
 * are rides (`@/services/rides`). Home-page events and Memory Lane still read
 * sample content from `src/data` until they get a CMS.
 */

import { events } from "@/data/events";
import { memories } from "@/data/memories";
import { getApiClient } from "@/lib/api";
import type {
  ApiFounder,
  ApiGroup,
  ApiRiderSpotlight,
  ApiStoryDetail,
  ApiStorySummary,
} from "@/lib/api";
import type { CommunityEvent, Founder, Group, Memory, RiderSpotlight, Story } from "@/types";
import { toFounder, toGroup, toRiderSpotlight, toStory, toStoryDetail } from "./community-mappers";
import { orNull } from "./request-helpers";

const api = () => getApiClient();

/** Published founders in the order set in the CMS. */
export async function listFounders(): Promise<Founder[]> {
  try {
    const rows = await api().request<ApiFounder[]>("/community/founders", { auth: false });
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(toFounder);
    }
  } catch (error) {
    console.warn("Could not load founders from API, using default founders:", error);
  }
  return [
    toFounder({
      id: "01a0c331-8e80-7abf-b106-44a4292a1309",
      name: "Abhishek Sharma",
      role: "Founding",
      shortBio: null,
      story: null,
      quote: null,
      instagramUrl: null,
      linkedinUrl: null,
      image: null,
      sortOrder: 0,
    }),
    toFounder({
      id: "01a0c331-8e81-7e5e-a32d-c1df17f3e420",
      name: "Simran Khaturia",
      role: "Founding",
      shortBio: null,
      story: null,
      quote: null,
      instagramUrl: null,
      linkedinUrl: null,
      image: null,
      sortOrder: 1,
    }),
  ];
}

/** Published stories: featured first, then the CMS order, then newest. */
export async function listStories(options: { limit?: number } = {}): Promise<Story[]> {
  const rows = await api().request<ApiStorySummary[]>("/community/stories", {
    auth: false,
    query: { limit: options.limit },
  });
  return rows.map(toStory);
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const row = await orNull(
    api().request<ApiStoryDetail>(`/community/stories/${encodeURIComponent(slug)}`, {
      auth: false,
    }),
  );
  return row ? toStoryDetail(row) : null;
}

export async function listMoreStories(slug: string, limit = 3): Promise<Story[]> {
  const stories = await listStories({ limit: limit + 1 });
  return stories.filter((story) => story.slug !== slug).slice(0, limit);
}

/** Published rider spotlights in the order set in the CMS. */
export async function listRiderSpotlights(): Promise<RiderSpotlight[]> {
  const rows = await api().request<ApiRiderSpotlight[]>("/community/riders", { auth: false });
  return rows.map(toRiderSpotlight);
}

/** Published groups and chapters in the order set in the CMS. */
export async function listGroups(): Promise<Group[]> {
  const rows = await api().request<ApiGroup[]>("/community/groups", { auth: false });
  return rows.map(toGroup);
}

export async function getGroupBySlug(slug: string): Promise<Group | null> {
  const row = await orNull(
    api().request<ApiGroup>(`/community/groups/${encodeURIComponent(slug)}`, { auth: false }),
  );
  return row ? toGroup(row) : null;
}

/** Sample events shown on the home page, soonest first. */
export async function listEvents(options: { limit?: number } = {}): Promise<CommunityEvent[]> {
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  return options.limit === undefined ? sorted : sorted.slice(0, options.limit);
}

/** Memory Lane (sample content), newest first. */
export async function listMemories(): Promise<Memory[]> {
  return [...memories];
}
