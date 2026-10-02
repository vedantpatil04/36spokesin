import { Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { CursorPage } from "../common/http/cursor-page.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory } from "../generated/prisma/enums.js";
import type { AdminMediaAssetDto, AdminMediaQueryDto } from "./dto/admin-media.dto.js";
import {
  MEDIA_REFERENCE_COUNT_SELECT,
  UNREFERENCED_WHERE,
  describeReferences,
  totalReferences,
} from "./media-references.js";
import { MediaService } from "./media.service.js";

/** Categories managed through the admin media library: catalogue and community images. */
export const CATALOGUE_MEDIA_CATEGORIES: readonly MediaCategory[] = [
  MediaCategory.PRODUCT,
  MediaCategory.BIKE,
  MediaCategory.COMMUNITY,
  MediaCategory.STORY,
  MediaCategory.GROUP,
];

/** Admin view over catalogue media: what exists, what uses it, and cleanup of orphans. */
@Injectable()
export class MediaLibraryService {
  private readonly logger = new Logger(MediaLibraryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  async list(query: AdminMediaQueryDto): Promise<CursorPage<AdminMediaAssetDto>> {
    const where: Prisma.MediaAssetWhereInput = {
      category: query.category ?? { in: [...CATALOGUE_MEDIA_CATEGORIES] },
      ...(query.unused ? UNREFERENCED_WHERE : {}),
    };
    const rows = await this.prisma.mediaAsset.findMany({
      where,
      include: MEDIA_REFERENCE_COUNT_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return CursorPage.fromRows(rows, query.limit, (row) => {
      const { _count: counts, ...asset } = row;
      return {
        ...this.media.toResponse(asset),
        usage: {
          total: totalReferences(counts),
          summary: describeReferences(counts),
          counts,
        },
      };
    });
  }

  /** Admin-only delete of catalogue media. Unlike the owner path, nothing is detached. */
  async remove(user: AuthUser, id: string): Promise<void> {
    const exists = await this.prisma.mediaAsset.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw notFound("Media asset");
    this.media.assertNotInUse(await this.media.countReferences(id));
    const deleted = await this.media.releaseIfUnreferenced(id);
    if (!deleted) this.media.assertNotInUse(await this.media.countReferences(id));
    this.logger.log({ adminId: user.id, mediaAssetId: id }, "Admin deleted media asset");
  }
}
