import { Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import { ContentStatus, MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CommunityMapper, spotlightInclude } from "./community.mapper.js";
import { DISPLAY_ORDER, nextSortOrder, nullable, planReorder } from "./community-rules.js";
import type {
  AdminCommunityQueryDto,
  CreateRiderSpotlightDto,
  ReorderDto,
  UpdateRiderSpotlightDto,
} from "./dto/community-input.dto.js";
import type { AdminRiderSpotlightDto, RiderSpotlightDto } from "./dto/community-response.dto.js";

const IMAGE_CATEGORIES = [MediaCategory.COMMUNITY, MediaCategory.SITE] as const;

/**
 * Rider spotlights: riders featured on the Community page with only the details
 * they chose to share. Not linked to accounts. Same lifecycle as founders.
 */
@Injectable()
export class RiderSpotlightsService {
  private readonly logger = new Logger(RiderSpotlightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CommunityMapper,
  ) {}

  async listPublic(): Promise<RiderSpotlightDto[]> {
    const rows = await this.prisma.riderSpotlight.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: spotlightInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.spotlight(row));
  }

  async adminList(query: AdminCommunityQueryDto): Promise<AdminRiderSpotlightDto[]> {
    const rows = await this.prisma.riderSpotlight.findMany({
      where: query.status ? { status: query.status } : {},
      include: spotlightInclude,
      orderBy: DISPLAY_ORDER,
    });
    return rows.map((row) => this.mapper.adminSpotlight(row));
  }

  async adminGet(id: string): Promise<AdminRiderSpotlightDto> {
    const row = await this.prisma.riderSpotlight.findUnique({
      where: { id },
      include: spotlightInclude,
    });
    if (!row) throw notFound("Rider spotlight");
    return this.mapper.adminSpotlight(row);
  }

  async create(admin: AuthUser, dto: CreateRiderSpotlightDto): Promise<AdminRiderSpotlightDto> {
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, IMAGE_CATEGORIES);
    const sortOrder =
      dto.sortOrder ??
      nextSortOrder(
        await this.prisma.riderSpotlight.findFirst({
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        }),
      );
    const row = await this.prisma.riderSpotlight.create({
      data: {
        name: dto.name,
        bike: dto.bike ?? null,
        location: dto.location ?? null,
        favouriteRide: dto.favouriteRide ?? null,
        shortStory: dto.shortStory ?? null,
        imageMediaId: dto.imageMediaId ?? null,
        status: dto.status ?? ContentStatus.DRAFT,
        sortOrder,
      },
      include: spotlightInclude,
    });
    this.logger.log({ adminId: admin.id, spotlightId: row.id }, "Rider spotlight created");
    return this.mapper.adminSpotlight(row);
  }

  async update(
    admin: AuthUser,
    id: string,
    dto: UpdateRiderSpotlightDto,
  ): Promise<AdminRiderSpotlightDto> {
    const existing = await this.prisma.riderSpotlight.findUnique({
      where: { id },
      select: { imageMediaId: true },
    });
    if (!existing) throw notFound("Rider spotlight");
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, IMAGE_CATEGORIES);

    const row = await this.prisma.riderSpotlight.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...nullable(dto, ["bike", "location", "favouriteRide", "shortStory", "imageMediaId"]),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
      },
      include: spotlightInclude,
    });
    if (existing.imageMediaId && existing.imageMediaId !== row.imageMediaId) {
      await this.media.releaseIfUnreferenced(existing.imageMediaId);
    }
    this.logger.log(
      { adminId: admin.id, spotlightId: id, fields: Object.keys(dto) },
      "Rider spotlight updated",
    );
    return this.mapper.adminSpotlight(row);
  }

  archive(admin: AuthUser, id: string): Promise<AdminRiderSpotlightDto> {
    return this.update(admin, id, { status: ContentStatus.ARCHIVED });
  }

  async reorder(admin: AuthUser, dto: ReorderDto): Promise<AdminRiderSpotlightDto[]> {
    const current = await this.prisma.riderSpotlight.findMany({
      orderBy: DISPLAY_ORDER,
      select: { id: true, sortOrder: true },
    });
    const writes = planReorder(current, dto.ids);
    await this.prisma.$transaction(
      writes.map(({ id, sortOrder }) =>
        this.prisma.riderSpotlight.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    this.logger.log({ adminId: admin.id, moved: writes.length }, "Rider spotlights reordered");
    return this.adminList({});
  }
}
