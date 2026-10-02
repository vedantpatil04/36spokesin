/**
 * Social / Instagram feed service for public pages.
 */

import { getApiClient } from "@/lib/api";
import type { ApiSocialPost } from "@/lib/api";
import { features } from "@/lib/env";

const INITIAL_PUBLISHED_POSTS: ApiSocialPost[] = [
  {
    id: "01a0bf3a-0e96-74af-9d2d-90d764354e0e",
    postUrl: "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==",
    mediaType: "VIDEO",
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: "INSTAGRAM",
    sortOrder: 0,
    isFeatured: false,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "01a0bf50-c5e7-716c-9339-02db32947214",
    postUrl: "https://www.instagram.com/reel/Ddf_jSxInDn/?stkn=MTA0aGZ2YW9hbjlicw==",
    mediaType: "VIDEO",
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: "INSTAGRAM",
    sortOrder: 1,
    isFeatured: false,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "01a0bf50-c5ee-73c4-b269-4abbd8079a67",
    postUrl: "https://www.instagram.com/p/Dderu-dyxUP/?stkn=MWc0Znp5b2ttdzBlaQ==",
    mediaType: "IMAGE",
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: "INSTAGRAM",
    sortOrder: 2,
    isFeatured: false,
    createdAt: "2026-03-01T00:00:00.000Z",
  },
];

/**
 * Published social posts in display order.
 * Queries PostgreSQL via backend API; falls back to initial published posts if API is unavailable.
 */
export async function listPublishedSocialPosts(): Promise<ApiSocialPost[]> {
  if (features.backend) {
    try {
      const posts = await getApiClient().request<ApiSocialPost[]>("/social-posts", { auth: false });
      if (Array.isArray(posts)) {
        return posts;
      }
    } catch (error) {
      console.warn("Could not load social posts from API, using initial records:", error);
    }
  }
  return INITIAL_PUBLISHED_POSTS;
}
