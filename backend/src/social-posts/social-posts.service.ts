import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma, SocialPost, MediaAsset } from "../generated/prisma/client.js";
import { MediaStatus, SocialMediaType, SocialPostStatus } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import {
  AdminSocialPostQueryDto,
  CreateSocialPostDto,
  ReorderSocialPostsDto,
  UpdateSocialPostDto,
} from "./dto/social-post-input.dto.js";
import type { AdminSocialPostDto, SocialPostSummaryDto } from "./dto/social-post-response.dto.js";
import { inferMediaTypeFromInstagramUrl, normalizeInstagramUrl } from "./instagram-url.js";

type SocialPostRow = SocialPost & { mediaAsset?: MediaAsset | null };

@Injectable()
export class SocialPostsService {
  private readonly logger = new Logger(SocialPostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  private async validateMediaAsset(
    mediaAssetId: string | null | undefined,
    mediaType: SocialMediaType,
  ): Promise<void> {
    if (!mediaAssetId) return;
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
    });
    if (!asset) {
      throw new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.NOT_FOUND, "Media asset not found.");
    }
    if (asset.status !== MediaStatus.READY) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.MEDIA_NOT_USABLE,
        "Media asset is not ready for use.",
      );
    }
    if (mediaType === SocialMediaType.IMAGE && !asset.mimeType.startsWith("image/")) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.MEDIA_NOT_USABLE,
        `Media asset must be an image for an IMAGE post, but got ${asset.mimeType}.`,
      );
    }
    if (mediaType === SocialMediaType.VIDEO && !asset.mimeType.startsWith("video/")) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.MEDIA_NOT_USABLE,
        `Media asset must be a video for a VIDEO post, but got ${asset.mimeType}.`,
      );
    }
  }

  private resolveImageUrl(row: SocialPostRow): string | null {
    if (
      row.mediaType === SocialMediaType.IMAGE &&
      row.mediaAsset &&
      row.mediaAsset.status === MediaStatus.READY
    ) {
      const publicUrl = this.media.publicUrl(row.mediaAsset.storageKey);
      if (publicUrl) return publicUrl;
    }
    return row.imageUrl ?? null;
  }

  private resolveVideoUrl(row: SocialPostRow): string | null {
    if (
      row.mediaType === SocialMediaType.VIDEO &&
      row.mediaAsset &&
      row.mediaAsset.status === MediaStatus.READY
    ) {
      const publicUrl = this.media.publicUrl(row.mediaAsset.storageKey);
      if (publicUrl) return publicUrl;
    }
    return row.videoUrl ?? null;
  }

  private toSummaryDto(row: SocialPostRow): SocialPostSummaryDto {
    return {
      id: row.id,
      postUrl: row.postUrl,
      mediaType: row.mediaType,
      imageUrl: this.resolveImageUrl(row),
      videoUrl: this.resolveVideoUrl(row),
      caption: row.caption,
      username: row.username,
      platform: row.platform,
      sortOrder: row.sortOrder,
      isFeatured: row.isFeatured,
      createdAt: row.createdAt,
    };
  }

  private toAdminDto(row: SocialPostRow): AdminSocialPostDto {
    return {
      ...this.toSummaryDto(row),
      status: row.status,
      mediaAssetId: row.mediaAssetId,
      updatedAt: row.updatedAt,
      createdById: row.createdById,
      updatedById: row.updatedById,
    };
  }

  // ─── Public ──────────────────────────────────────────────────────────────

  async listPublic(): Promise<SocialPostSummaryDto[]> {
    const rows = await this.prisma.socialPost.findMany({
      where: { status: SocialPostStatus.PUBLISHED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { mediaAsset: true },
    });
    return rows.map((row) => this.toSummaryDto(row));
  }

  // ─── Admin ───────────────────────────────────────────────────────────────

  async adminList(query: AdminSocialPostQueryDto): Promise<AdminSocialPostDto[]> {
    const rows = await this.prisma.socialPost.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { mediaAsset: true },
    });
    return rows.map((row) => this.toAdminDto(row));
  }

  async adminGet(id: string): Promise<AdminSocialPostDto> {
    const row = await this.prisma.socialPost.findUnique({
      where: { id },
      include: { mediaAsset: true },
    });
    if (!row) throw notFound("Social post not found.");
    return this.toAdminDto(row);
  }

  async create(admin: AuthUser, dto: CreateSocialPostDto): Promise<AdminSocialPostDto> {
    const postUrl = normalizeInstagramUrl(dto.postUrl);
    const mediaType = dto.mediaType ?? inferMediaTypeFromInstagramUrl(postUrl);
    if (dto.mediaAssetId) {
      await this.validateMediaAsset(dto.mediaAssetId, mediaType);
    }

    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const highest = await this.prisma.socialPost.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (highest?.sortOrder ?? -1) + 1;
    }

    const row = await this.prisma.socialPost.create({
      data: {
        postUrl,
        mediaType,
        platform: dto.platform,
        username: dto.username,
        caption: dto.caption,
        imageUrl: dto.imageUrl,
        videoUrl: dto.videoUrl,
        mediaAssetId: dto.mediaAssetId,
        status: dto.status,
        sortOrder,
        isFeatured: dto.isFeatured ?? false,
        createdById: admin.id,
        updatedById: admin.id,
      },
      include: { mediaAsset: true },
    });

    this.logger.log({ postId: row.id, adminId: admin.id }, "Social post created");
    return this.toAdminDto(row);
  }

  async update(admin: AuthUser, id: string, dto: UpdateSocialPostDto): Promise<AdminSocialPostDto> {
    const existing = await this.prisma.socialPost.findUnique({
      where: { id },
      include: { mediaAsset: true },
    });
    if (!existing) throw notFound("Social post not found.");

    const postUrl = dto.postUrl !== undefined ? normalizeInstagramUrl(dto.postUrl) : undefined;
    const mediaType =
      dto.mediaType ?? (postUrl ? inferMediaTypeFromInstagramUrl(postUrl) : existing.mediaType);
    const mediaAssetId = dto.mediaAssetId !== undefined ? dto.mediaAssetId : existing.mediaAssetId;
    if (mediaAssetId) {
      await this.validateMediaAsset(mediaAssetId, mediaType);
    }

    const previousAssetId = existing.mediaAssetId;

    const row = await this.prisma.socialPost.update({
      where: { id },
      data: {
        ...(postUrl !== undefined ? { postUrl } : {}),
        ...(dto.mediaType !== undefined || postUrl !== undefined ? { mediaType } : {}),
        ...(dto.platform !== undefined ? { platform: dto.platform } : {}),
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.caption !== undefined ? { caption: dto.caption } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.videoUrl !== undefined ? { videoUrl: dto.videoUrl } : {}),
        ...(dto.mediaAssetId !== undefined ? { mediaAssetId: dto.mediaAssetId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        updatedById: admin.id,
      },
      include: { mediaAsset: true },
    });

    if (previousAssetId && dto.mediaAssetId !== undefined && previousAssetId !== dto.mediaAssetId) {
      await this.media.releaseIfUnreferenced(previousAssetId);
    }

    this.logger.log({ postId: row.id, adminId: admin.id }, "Social post updated");
    return this.toAdminDto(row);
  }


  async archive(admin: AuthUser, id: string): Promise<AdminSocialPostDto> {
    await this.adminGet(id);

    const row = await this.prisma.socialPost.update({
      where: { id },
      data: {
        status: SocialPostStatus.ARCHIVED,
        updatedById: admin.id,
      },
      include: { mediaAsset: true },
    });

    this.logger.log({ postId: row.id, adminId: admin.id }, "Social post archived");
    return this.toAdminDto(row);
  }

  async reorder(admin: AuthUser, dto: ReorderSocialPostsDto): Promise<AdminSocialPostDto[]> {
    await this.prisma.$transaction(
      dto.postIds.map((id, index) =>
        this.prisma.socialPost.update({
          where: { id },
          data: { sortOrder: index, updatedById: admin.id },
        }),
      ),
    );

    this.logger.log({ count: dto.postIds.length, adminId: admin.id }, "Social posts reordered");
    return this.adminList({});
  }
}
