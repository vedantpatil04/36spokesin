import { events } from "@/data/events";
import { groups } from "@/data/groups";
import { memories } from "@/data/memories";
import { riders } from "@/data/riders";
import { stories } from "@/data/stories";
import type { CommunityEvent, Group, Memory, Rider, Story } from "@/types";

export async function listRiders(): Promise<Rider[]> {
  return [...riders];
}

export async function listGroups(): Promise<Group[]> {
  return [...groups];
}

/** Upcoming events, soonest first. */
export async function listEvents(options: { limit?: number } = {}): Promise<CommunityEvent[]> {
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  return options.limit === undefined ? sorted : sorted.slice(0, options.limit);
}

/** Newest first, as authored. */
export async function listStories(): Promise<Story[]> {
  return [...stories];
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  return stories.find((story) => story.slug === slug) ?? null;
}

export async function listMoreStories(slug: string, limit = 3): Promise<Story[]> {
  return stories.filter((story) => story.slug !== slug).slice(0, limit);
}

/** Newest first. */
export async function listMemories(): Promise<Memory[]> {
  return [...memories];
}
