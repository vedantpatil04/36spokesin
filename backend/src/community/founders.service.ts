import { Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import { ContentStatus, MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CommunityMapper, founderInclude } from "./community.mapper.js";
import { DISPLAY_ORDER, nextSortOrder, nullable, planReorder } from "./community-rules.js";
import type {
  AdminCommunityQueryDto,
  CreateFounderDto,
  ReorderDto,
  UpdateFounderDto,
} from "./dto/community-input.dto.js";
import type { AdminFounderDto, FounderDto } from "./dto/community-response.dto.js";

const IMAGE_CATEGORIES = [MediaCategory.COMMUNITY, MediaCategory.SITE] as const;

/**
 * Founders of 36 Spokes. Public reads return PUBLISHED founders in display
 * order. Admins create, edit, publish, archive and reorder; nothing is deleted.
 * A replaced photo is released once nothing else uses it.
 */
@Injectable()
export class FoundersService {
  private readonly logger = new Logger(FoundersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CommunityMapper,
  ) {}

  async listPublic(): Promise<FounderDto[]> {
    const rows = await this.prisma.founder.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: founderInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.founder(row));
  }

  async adminList(query: AdminCommunityQueryDto): Promise<AdminFounderDto[]> {
    const rows = await this.prisma.founder.findMany({
      where: query.status ? { status: query.status } : {},
      include: founderInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.adminFounder(row));
  }

  async adminGet(id: string): Promise<AdminFounderDto> {
    const row = await this.prisma.founder.findUnique({ where: { id }, include: founderInclude });
    if (!row) throw notFound("Founder");
    return this.mapper.adminFounder(row);
  }

  async create(admin: AuthUser, dto: CreateFounderDto): Promise<AdminFounderDto> {
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, IMAGE_CATEGORIES);
    const sortOrder =
      dto.sortOrder ??
      nextSortOrder(
        await this.prisma.founder.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
      );
    const row = await this.prisma.founder.create({
      data: {
        name: dto.name,
        role: dto.role ?? null,
        shortBio: dto.shortBio ?? null,
        story: dto.story ?? null,
        quote: dto.quote ?? null,
        instagramUrl: dto.instagramUrl ?? null,
        linkedinUrl: dto.linkedinUrl ?? null,
        imageMediaId: dto.imageMediaId ?? null,
        status: dto.status ?? ContentStatus.DRAFT,
        sortOrder,
        createdById: admin.id,
        updatedById: admin.id,
      },
      include: founderInclude,
    });
    this.logger.log({ adminId: admin.id, founderId: row.id }, "Founder created");
    return this.mapper.adminFounder(row);
  }

  async update(admin: AuthUser, id: string, dto: UpdateFounderDto): Promise<AdminFounderDto> {
    const existing = await this.prisma.founder.findUnique({
      where: { id },
      select: { imageMediaId: true },
    });
    if (!existing) throw notFound("Founder");
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, IMAGE_CATEGORIES);

    const row = await this.prisma.founder.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...nullable(dto, [
          "role",
          "shortBio",
          "story",
          "quote",
          "instagramUrl",
          "linkedinUrl",
          "imageMediaId",
        ]),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
        updatedById: admin.id,
      },
      include: founderInclude,
    });
    if (existing.imageMediaId && existing.imageMediaId !== row.imageMediaId) {
      await this.media.releaseIfUnreferenced(existing.imageMediaId);
    }
    this.logger.log(
      { adminId: admin.id, founderId: id, fields: Object.keys(dto) },
      "Founder updated",
    );
    return this.mapper.adminFounder(row);
  }

  archive(admin: AuthUser, id: string): Promise<AdminFounderDto> {
    return this.update(admin, id, { status: ContentStatus.ARCHIVED });
  }

  async reorder(admin: AuthUser, dto: ReorderDto): Promise<AdminFounderDto[]> {
    const current = await this.prisma.founder.findMany({
      orderBy: DISPLAY_ORDER,
      select: { id: true, sortOrder: true },
    });
    const writes = planReorder(current, dto.ids);
    await this.prisma.$transaction(
      writes.map(({ id, sortOrder }) =>
        this.prisma.founder.update({ where: { id }, data: { sortOrder, updatedById: admin.id } }),
      ),
    );
    this.logger.log({ adminId: admin.id, moved: writes.length }, "Founders reordered");
    return this.adminList({});
  }
}
