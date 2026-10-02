import { Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { invalidReference, resolveSlug, slugTaken } from "../catalog/unique-slug.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ContentStatus, MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CommunityMapper, storyInclude } from "./community.mapper.js";
import { nextSortOrder, nullable, planReorder } from "./community-rules.js";
import type {
  AdminCommunityQueryDto,
  CreateStoryDto,
  ReorderDto,
  StoryListQueryDto,
  UpdateStoryDto,
} from "./dto/community-input.dto.js";
import type {
  AdminStoryDto,
  StoryDetailDto,
  StorySummaryDto,
} from "./dto/community-response.dto.js";

const COVER_CATEGORIES = [MediaCategory.STORY, MediaCategory.SITE] as const;
const PUBLISHED = ContentStatus.PUBLISHED;

/** Featured first, then the admin's order, then newest. */
const STORY_ORDER = [
  { featured: "desc" },
  { sortOrder: "asc" },
  { publishedAt: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
] satisfies Prisma.StoryOrderByWithRelationInput[];

/**
 * Rider stories. Public reads return PUBLISHED stories; `publishedAt` is set the
 * first time a story is published and kept through later edits.
 */
@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CommunityMapper,
  ) {}

  async listPublic(query: StoryListQueryDto): Promise<StorySummaryDto[]> {
    const rows = await this.prisma.story.findMany({
      where: {
        status: PUBLISHED,
        ...(query.featured !== undefined ? { featured: query.featured } : {}),
      },
      include: storyInclude,
      orderBy: STORY_ORDER,
      take: query.limit ?? 100,
    });
    return rows.map((row) => this.mapper.story(row));
  }

  async getPublic(slug: string): Promise<StoryDetailDto> {
    const row = await this.prisma.story.findFirst({
      where: { slug, status: PUBLISHED },
      include: storyInclude,
    });
    if (!row) throw notFound("Story");
    return this.mapper.storyDetail(row);
  }

  async adminList(query: AdminCommunityQueryDto): Promise<AdminStoryDto[]> {
    const rows = await this.prisma.story.findMany({
      where: query.status ? { status: query.status } : {},
      include: storyInclude,
      orderBy: STORY_ORDER,
    });
    return rows.map((row) => this.mapper.adminStory(row));
  }

  async adminGet(id: string): Promise<AdminStoryDto> {
    const row = await this.prisma.story.findUnique({ where: { id }, include: storyInclude });
    if (!row) throw notFound("Story");
    return this.mapper.adminStory(row);
  }

  async create(admin: AuthUser, dto: CreateStoryDto): Promise<AdminStoryDto> {
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.title,
      entity: "story",
      isTaken: async (candidate) =>
        (await this.prisma.story.count({ where: { slug: candidate } })) > 0,
    });
    if (dto.coverMediaId) await this.media.assertAttachable(dto.coverMediaId, COVER_CATEGORIES);
    if (dto.destinationId) await this.assertDestination(dto.destinationId);
    const status = dto.status ?? ContentStatus.DRAFT;
    const sortOrder =
      dto.sortOrder ??
      nextSortOrder(
        await this.prisma.story.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
      );
    const row = await this.prisma.story.create({
      data: {
        slug,
        title: dto.title,
        excerpt: dto.excerpt ?? null,
        content: dto.content ?? null,
        authorName: dto.authorName ?? null,
        coverMediaId: dto.coverMediaId ?? null,
        destinationId: dto.destinationId ?? null,
        featured: dto.featured ?? false,
        status,
        sortOrder,
        publishedAt: status === PUBLISHED ? new Date() : null,
      },
      include: storyInclude,
    });
    this.logger.log({ adminId: admin.id, storyId: row.id, status }, "Story created");
    return this.mapper.adminStory(row);
  }

  async update(admin: AuthUser, id: string, dto: UpdateStoryDto): Promise<AdminStoryDto> {
    const existing = await this.prisma.story.findUnique({
      where: { id },
      select: { slug: true, coverMediaId: true, publishedAt: true },
    });
    if (!existing) throw notFound("Story");
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      (await this.prisma.story.count({ where: { slug: dto.slug } }))
    ) {
      throw slugTaken("story");
    }
    if (dto.coverMediaId) await this.media.assertAttachable(dto.coverMediaId, COVER_CATEGORIES);
    if (dto.destinationId) await this.assertDestination(dto.destinationId);

    const row = await this.prisma.story.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...nullable(dto, ["excerpt", "content", "authorName", "coverMediaId", "destinationId"]),
        ...(dto.featured !== undefined && dto.featured !== null ? { featured: dto.featured } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
        ...(dto.status === PUBLISHED && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
      include: storyInclude,
    });
    if (existing.coverMediaId && existing.coverMediaId !== row.coverMediaId) {
      await this.media.releaseIfUnreferenced(existing.coverMediaId);
    }
    this.logger.log({ adminId: admin.id, storyId: id, fields: Object.keys(dto) }, "Story updated");
    return this.mapper.adminStory(row);
  }

  archive(admin: AuthUser, id: string): Promise<AdminStoryDto> {
    return this.update(admin, id, { status: ContentStatus.ARCHIVED });
  }

  async reorder(admin: AuthUser, dto: ReorderDto): Promise<AdminStoryDto[]> {
    const current = await this.prisma.story.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, sortOrder: true },
    });
    const writes = planReorder(current, dto.ids);
    await this.prisma.$transaction(
      writes.map(({ id, sortOrder }) =>
        this.prisma.story.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    this.logger.log({ adminId: admin.id, moved: writes.length }, "Stories reordered");
    return this.adminList({});
  }

  private async assertDestination(id: string): Promise<void> {
    if (!(await this.prisma.destination.count({ where: { id } }))) {
      throw invalidReference("destinationId", "The selected destination does not exist.");
    }
  }
}
