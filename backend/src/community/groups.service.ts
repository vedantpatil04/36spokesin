import { Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { resolveSlug, slugTaken } from "../catalog/unique-slug.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import { ContentStatus, MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CommunityMapper, groupInclude } from "./community.mapper.js";
import { DISPLAY_ORDER, nextSortOrder, nullable, planReorder } from "./community-rules.js";
import type {
  AdminCommunityQueryDto,
  CreateGroupDto,
  ReorderDto,
  UpdateGroupDto,
} from "./dto/community-input.dto.js";
import type { AdminGroupDto, GroupDto } from "./dto/community-response.dto.js";

const COVER_CATEGORIES = [MediaCategory.GROUP, MediaCategory.SITE] as const;

/**
 * Groups and chapters: the foundation only (no membership, chat or payments).
 * `memberCount` is stored only when an admin knows it.
 */
@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CommunityMapper,
  ) {}

  async listPublic(): Promise<GroupDto[]> {
    const rows = await this.prisma.communityGroup.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: groupInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.group(row));
  }

  async getPublic(slug: string): Promise<GroupDto> {
    const row = await this.prisma.communityGroup.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED },
      include: groupInclude,
    });
    if (!row) throw notFound("Group");
    return this.mapper.group(row);
  }

  async adminList(query: AdminCommunityQueryDto): Promise<AdminGroupDto[]> {
    const rows = await this.prisma.communityGroup.findMany({
      where: query.status ? { status: query.status } : {},
      include: groupInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.adminGroup(row));
  }

  async adminGet(id: string): Promise<AdminGroupDto> {
    const row = await this.prisma.communityGroup.findUnique({
      where: { id },
      include: groupInclude,
    });
    if (!row) throw notFound("Group");
    return this.mapper.adminGroup(row);
  }

  async create(admin: AuthUser, dto: CreateGroupDto): Promise<AdminGroupDto> {
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "group",
      isTaken: async (candidate) =>
        (await this.prisma.communityGroup.count({ where: { slug: candidate } })) > 0,
    });
    if (dto.coverMediaId) await this.media.assertAttachable(dto.coverMediaId, COVER_CATEGORIES);
    const sortOrder =
      dto.sortOrder ??
      nextSortOrder(
        await this.prisma.communityGroup.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
      );
    const row = await this.prisma.communityGroup.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description ?? null,
        region: dto.region ?? null,
        rideCadence: dto.rideCadence ?? null,
        memberCount: dto.memberCount ?? null,
        coverMediaId: dto.coverMediaId ?? null,
        status: dto.status ?? ContentStatus.DRAFT,
        sortOrder,
      },
      include: groupInclude,
    });
    this.logger.log({ adminId: admin.id, groupId: row.id }, "Group created");
    return this.mapper.adminGroup(row);
  }

  async update(admin: AuthUser, id: string, dto: UpdateGroupDto): Promise<AdminGroupDto> {
    const existing = await this.prisma.communityGroup.findUnique({
      where: { id },
      select: { slug: true, coverMediaId: true },
    });
    if (!existing) throw notFound("Group");
    if (
      dto.slug &&
      dto.slug !== existing.slug &&
      (await this.prisma.communityGroup.count({ where: { slug: dto.slug } }))
    ) {
      throw slugTaken("group");
    }
    if (dto.coverMediaId) await this.media.assertAttachable(dto.coverMediaId, COVER_CATEGORIES);

    const row = await this.prisma.communityGroup.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...nullable(dto, ["description", "region", "rideCadence", "memberCount", "coverMediaId"]),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
      },
      include: groupInclude,
    });
    if (existing.coverMediaId && existing.coverMediaId !== row.coverMediaId) {
      await this.media.releaseIfUnreferenced(existing.coverMediaId);
    }
    this.logger.log({ adminId: admin.id, groupId: id, fields: Object.keys(dto) }, "Group updated");
    return this.mapper.adminGroup(row);
  }

  archive(admin: AuthUser, id: string): Promise<AdminGroupDto> {
    return this.update(admin, id, { status: ContentStatus.ARCHIVED });
  }

  async reorder(admin: AuthUser, dto: ReorderDto): Promise<AdminGroupDto[]> {
    const current = await this.prisma.communityGroup.findMany({
      orderBy: DISPLAY_ORDER,
      select: { id: true, sortOrder: true },
    });
    const writes = planReorder(current, dto.ids);
    await this.prisma.$transaction(
      writes.map(({ id, sortOrder }) =>
        this.prisma.communityGroup.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    this.logger.log({ adminId: admin.id, moved: writes.length }, "Groups reordered");
    return this.adminList({});
  }
}
