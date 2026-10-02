/**
 * Admin CMS service for managing Social / Instagram feed posts.
 */

import { getApiClient } from "@/lib/api";
import type {
  ApiAdminSocialPost,
  ApiSocialMediaType,
  ApiSocialPlatform,
  ApiSocialPostStatus,
} from "@/lib/api";

export type SocialPostInput = {
  postUrl: string;
  mediaType?: ApiSocialMediaType;
  platform?: ApiSocialPlatform;
  username?: string | null;
  caption?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaAssetId?: string | null;
  status?: ApiSocialPostStatus;
  sortOrder?: number;
  isFeatured?: boolean;
};

const api = () => getApiClient();

export const listAdminSocialPosts = (query?: { status?: ApiSocialPostStatus }) =>
  api().request<ApiAdminSocialPost[]>("/admin/social-posts", {
    query: { status: query?.status },
  });

export const getAdminSocialPost = (id: string) =>
  api().request<ApiAdminSocialPost>(`/admin/social-posts/${id}`);

export const createSocialPost = (input: SocialPostInput) =>
  api().request<ApiAdminSocialPost>("/admin/social-posts", {
    method: "POST",
    body: input,
  });

export const updateSocialPost = (id: string, input: Partial<SocialPostInput>) =>
  api().request<ApiAdminSocialPost>(`/admin/social-posts/${id}`, {
    method: "PATCH",
    body: input,
  });

export const archiveSocialPost = (id: string) =>
  api().request<ApiAdminSocialPost>(`/admin/social-posts/${id}`, {
    method: "DELETE",
  });

export const reorderSocialPosts = (postIds: string[]) =>
  api().request<ApiAdminSocialPost[]>("/admin/social-posts/reorder", {
    method: "POST",
    body: { postIds },
  });
