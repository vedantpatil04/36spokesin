import { Injectable } from "@nestjs/common";
import type { ImageDto } from "../catalog/dto/catalog-response.dto.js";
import type { MediaAsset, Prisma } from "../generated/prisma/client.js";
import { ContentStatus, MediaStatus } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import type {
  AdminFounderDto,
  AdminGroupDto,
  AdminRiderSpotlightDto,
  AdminStoryDto,
  FounderDto,
  GroupDto,
  RiderSpotlightDto,
  StoryDetailDto,
  StorySummaryDto,
} from "./dto/community-response.dto.js";

export const founderInclude = { image: true } satisfies Prisma.FounderInclude;
export const spotlightInclude = { image: true } satisfies Prisma.RiderSpotlightInclude;
export const groupInclude = { cover: true } satisfies Prisma.CommunityGroupInclude;
export const storyInclude = {
  cover: true,
  destination: { select: { id: true, slug: true, name: true, status: true } },
} satisfies Prisma.StoryInclude;

export type FounderRow = Prisma.FounderGetPayload<{ include: typeof founderInclude }>;
export type SpotlightRow = Prisma.RiderSpotlightGetPayload<{ include: typeof spotlightInclude }>;
export type GroupRow = Prisma.CommunityGroupGetPayload<{ include: typeof groupInclude }>;
export type StoryRow = Prisma.StoryGetPayload<{ include: typeof storyInclude }>;

const WORDS_PER_MINUTE = 200;

/** Reading time for plain-text content; at least one minute. */
export function readMinutes(...texts: (string | null)[]): number {
  const words = texts
    .filter((text): text is string => Boolean(text))
    .reduce((sum, text) => sum + text.split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Community rows → API shapes. Image URLs come from the configured storage. */
@Injectable()
export class CommunityMapper {
  constructor(private readonly media: MediaService) {}

  image(asset: MediaAsset | null): ImageDto | null {
    if (!asset) return null;
    return {
      id: asset.id,
      url: asset.status === MediaStatus.READY ? this.media.publicUrl(asset.storageKey) : null,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
    };
  }

  founder(row: FounderRow): FounderDto {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      shortBio: row.shortBio,
      story: row.story,
      quote: row.quote,
      instagramUrl: row.instagramUrl,
      linkedinUrl: row.linkedinUrl,
      image: this.image(row.image),
      sortOrder: row.sortOrder,
    };
  }

  adminFounder(row: FounderRow): AdminFounderDto {
    return {
      ...this.founder(row),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdById: row.createdById,
      updatedById: row.updatedById,
    };
  }

  story(row: StoryRow): StorySummaryDto {
    const destination =
      row.destination && row.destination.status === ContentStatus.PUBLISHED
        ? { id: row.destination.id, slug: row.destination.slug, name: row.destination.name }
        : null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      authorName: row.authorName,
      cover: this.image(row.cover),
      destination,
      featured: row.featured,
      sortOrder: row.sortOrder,
      publishedAt: row.publishedAt,
      readMinutes: readMinutes(row.content ?? row.excerpt),
    };
  }

  storyDetail(row: StoryRow): StoryDetailDto {
    return { ...this.story(row), content: row.content };
  }

  adminStory(row: StoryRow): AdminStoryDto {
    return {
      ...this.storyDetail(row),
      status: row.status,
      destinationId: row.destinationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  spotlight(row: SpotlightRow): RiderSpotlightDto {
    return {
      id: row.id,
      name: row.name,
      bike: row.bike,
      location: row.location,
      favouriteRide: row.favouriteRide,
      shortStory: row.shortStory,
      image: this.image(row.image),
      sortOrder: row.sortOrder,
    };
  }

  adminSpotlight(row: SpotlightRow): AdminRiderSpotlightDto {
    return {
      ...this.spotlight(row),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  group(row: GroupRow): GroupDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      region: row.region,
      rideCadence: row.rideCadence,
      memberCount: row.memberCount,
      cover: this.image(row.cover),
      sortOrder: row.sortOrder,
    };
  }

  adminGroup(row: GroupRow): AdminGroupDto {
    return {
      ...this.group(row),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
