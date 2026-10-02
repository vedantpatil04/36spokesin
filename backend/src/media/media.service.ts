import { HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { CursorPage } from "../common/http/cursor-page.js";
import type { CursorPaginationQueryDto } from "../common/pagination/cursor-pagination.dto.js";
import { AppConfigService } from "../config/app-config.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { type MediaAsset, Prisma } from "../generated/prisma/client.js";
import { type MediaCategory, MediaStatus, UserRole } from "../generated/prisma/enums.js";
import type { CreateUploadDto } from "./dto/create-upload.dto.js";
import type {
  MediaAssetResponseDto,
  UploadSessionResponseDto,
} from "./dto/media-asset-response.dto.js";
import type { UpdateMediaAssetDto } from "./dto/update-media-asset.dto.js";
import { detectImageMimeType, detectVideoMimeType, readImageDimensions } from "./image-inspection.js";
import {
  DETACHABLE_REFERENCES,
  MEDIA_REFERENCE_COUNT_SELECT,
  type MediaReferenceCounts,
  NO_REFERENCES,
  describeReferences,
  totalReferences,
  type MediaReferenceKind,
} from "./media-references.js";
import { MEDIA_INSPECTION_BYTES, canUploadCategory } from "./media.policy.js";
import { MEDIA_PROCESSOR, type MediaProcessor } from "./processing/media-processor.js";
import { OBJECT_STORAGE, type ObjectStorage } from "./storage/object-storage.js";
import { notConfigured } from "./storage/unconfigured-object-storage.js";
import { buildStorageKey, sanitizeFileName } from "./storage-key.js";

/**
 * Direct-to-storage uploads:
 *   1. createUpload   — validate, record a PENDING asset, return a pre-signed PUT URL
 *   2. client uploads the bytes straight to R2 (the API never proxies files)
 *   3. completeUpload — verify the stored object (size, real format, dimensions), mark READY
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStorage,
    @Inject(MEDIA_PROCESSOR) private readonly processor: MediaProcessor,
  ) {}

  get storageConfigured(): boolean {
    return this.storage.isConfigured;
  }

  async createUpload(user: AuthUser, dto: CreateUploadDto): Promise<UploadSessionResponseDto> {
    this.assertStorage();

    if (!canUploadCategory(user.role, dto.category)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        "You are not allowed to upload media in this category.",
      );
    }

    const { maxUploadBytes, uploadUrlTtlSeconds } = this.config.media;
    if (dto.fileSize > maxUploadBytes) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.MEDIA_TOO_LARGE,
        `Files must be ${maxUploadBytes} bytes or smaller.`,
      );
    }

    const storageKey = buildStorageKey(dto.category, dto.mimeType);
    // Sign first: a signing failure then leaves no orphan PENDING row.
    const upload = await this.storage.createPresignedUpload({
      key: storageKey,
      contentType: dto.mimeType,
      contentLength: dto.fileSize,
      expiresInSeconds: uploadUrlTtlSeconds,
    });

    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        category: dto.category,
        originalFileName: sanitizeFileName(dto.fileName),
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        altText: dto.altText ?? null,
        ownerId: user.id,
      },
    });

    return { asset: this.toResponse(asset), upload };
  }

  async completeUpload(user: AuthUser, id: string): Promise<MediaAssetResponseDto> {
    this.assertStorage();
    const asset = await this.findAccessible(user, id);
    if (asset.status === MediaStatus.READY) return this.toResponse(asset);

    const stored = await this.storage.getObjectInfo(asset.storageKey);
    if (!stored) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.MEDIA_UPLOAD_MISSING,
        "The file has not been uploaded to storage yet.",
      );
    }

    if (
      stored.contentLength !== asset.fileSize ||
      stored.contentLength > this.config.media.maxUploadBytes
    ) {
      return this.reject(asset, "The uploaded file size does not match the declared size.");
    }
    if (stored.contentType && stored.contentType !== asset.mimeType) {
      return this.reject(asset, "The uploaded file type does not match the declared type.");
    }

    let width: number | null = null;
    let height: number | null = null;

    if (asset.mimeType.startsWith("image/")) {
      const head = await this.storage.readObjectStart(asset.storageKey, MEDIA_INSPECTION_BYTES);
      if (detectImageMimeType(head) !== asset.mimeType) {
        return this.reject(asset, "The uploaded file is not a valid image of the declared type.");
      }
      const dimensions = readImageDimensions(head);
      width = dimensions?.width ?? stored.width ?? null;
      height = dimensions?.height ?? stored.height ?? null;
    } else if (asset.mimeType.startsWith("video/")) {
      const head = await this.storage.readObjectStart(asset.storageKey, MEDIA_INSPECTION_BYTES);
      const detected = detectVideoMimeType(head);
      if (!detected || !detected.startsWith("video/")) {
        return this.reject(asset, "The uploaded file is not a valid video of the declared type.");
      }
      width = stored.width ?? null;
      height = stored.height ?? null;
    }

    let ready: MediaAsset;
    try {
      ready = await this.prisma.mediaAsset.update({
        where: { id: asset.id, status: MediaStatus.PENDING },
        data: {
          status: MediaStatus.READY,
          fileSize: stored.contentLength,
          width,
          height,
          uploadedAt: new Date(),
        },
      });
    } catch (error) {
      // A concurrent completion already marked it READY.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return this.toResponse(await this.findAccessible(user, id));
      }
      throw error;
    }

    this.logger.log({ mediaAssetId: ready.id, category: ready.category }, "Media upload completed");
    await this.processor.onAssetReady(ready).catch((error: unknown) => {
      this.logger.error({ err: error, mediaAssetId: ready.id }, "Media post-processing failed");
    });

    return this.toResponse(ready);
  }

  /** The caller's own READY assets, newest first. */
  async listOwn(
    user: AuthUser,
    query: CursorPaginationQueryDto,
  ): Promise<CursorPage<MediaAssetResponseDto>> {
    const rows = await this.prisma.mediaAsset.findMany({
      where: { ownerId: user.id, status: MediaStatus.READY },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return CursorPage.fromRows(rows, query.limit, (row) => this.toResponse(row));
  }

  async getOne(user: AuthUser, id: string): Promise<MediaAssetResponseDto> {
    return this.toResponse(await this.findAccessible(user, id));
  }

  async update(
    user: AuthUser,
    id: string,
    dto: UpdateMediaAssetDto,
  ): Promise<MediaAssetResponseDto> {
    await this.findAccessible(user, id);
    const asset = await this.prisma.mediaAsset.update({
      where: { id },
      data: { altText: dto.altText ?? null },
    });
    return this.toResponse(asset);
  }

  /**
   * Removes the record and then the stored object. The owner's own profile photo
   * is detached (Phase 3 behaviour); any other use — product, category or bike
   * images — blocks the delete with 409 MEDIA_IN_USE so a live page never loses
   * its image. The database backs this up: those relations are ON DELETE RESTRICT.
   */
  async remove(user: AuthUser, id: string): Promise<void> {
    const asset = await this.findAccessible(user, id);
    const counts = await this.countReferences(asset.id);
    this.assertNotInUse(counts, DETACHABLE_REFERENCES);

    try {
      await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
    } catch (error) {
      // Attached elsewhere between the check and the delete.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        this.assertNotInUse(await this.countReferences(asset.id), DETACHABLE_REFERENCES);
      }
      throw error;
    }
    await this.deleteStoredObject(asset.storageKey);
    this.logger.log({ mediaAssetId: asset.id, userId: user.id }, "Media asset deleted");
  }

  /** How many records use the asset, per relation. All zero when the asset does not exist. */
  async countReferences(
    assetId: string,
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<MediaReferenceCounts> {
    const asset = await client.mediaAsset.findUnique({
      where: { id: assetId },
      select: MEDIA_REFERENCE_COUNT_SELECT,
    });
    return asset ? asset._count : { ...NO_REFERENCES };
  }

  /**
   * Deletes the asset and its stored object only if nothing references it any
   * more. Called after an image is detached or replaced. Safe to call for assets
   * that are shared (e.g. by a duplicated product): they are kept.
   * Returns true when the asset was deleted.
   */
  async releaseIfUnreferenced(assetId: string): Promise<boolean> {
    let storageKey: string | null = null;
    try {
      storageKey = await this.prisma.$transaction(async (tx) => {
        const asset = await tx.mediaAsset.findUnique({
          where: { id: assetId },
          select: { storageKey: true, ...MEDIA_REFERENCE_COUNT_SELECT },
        });
        if (!asset || totalReferences(asset._count) > 0) return null;
        await tx.mediaAsset.delete({ where: { id: assetId } });
        return asset.storageKey;
      });
    } catch (error) {
      // A concurrent attach won the race: the RESTRICT foreign key kept the asset.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        return false;
      }
      throw error;
    }
    if (!storageKey) return false;
    await this.deleteStoredObject(storageKey);
    this.logger.log({ mediaAssetId: assetId }, "Unreferenced media asset released");
    return true;
  }

  /**
   * Confirms an asset can be attached to a catalogue record: it exists, it is
   * READY and its category is one of `categories`. Catalogue categories can only
   * be uploaded by admins (see media.policy.ts), so no ownership check is needed.
   */
  async assertAttachable(
    assetId: string,
    categories: readonly MediaCategory[],
    client: Prisma.TransactionClient = this.prisma,
  ): Promise<MediaAsset> {
    const asset = await client.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== MediaStatus.READY || !categories.includes(asset.category)) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.MEDIA_NOT_USABLE,
        `The media asset does not exist, has not finished uploading, or is not a ${categories
          .join(" or ")
          .toLowerCase()} image.`,
      );
    }
    return asset;
  }

  assertNotInUse(counts: MediaReferenceCounts, ignore: readonly MediaReferenceKind[] = []): void {
    if (totalReferences(counts, ignore) === 0) return;
    throw new ApiException(
      HttpStatus.CONFLICT,
      ErrorCode.MEDIA_IN_USE,
      `This image is still in use. ${describeReferences(counts, ignore)} Remove it from those first.`,
    );
  }

  /**
   * Confirms an asset can be attached to something the user owns: it exists, it
   * belongs to them, it is READY and it is of the expected category.
   */
  async assertUsableByOwner(
    ownerId: string,
    assetId: string,
    category: MediaCategory,
  ): Promise<void> {
    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
      select: { ownerId: true, status: true, category: true },
    });
    if (
      !asset ||
      asset.ownerId !== ownerId ||
      asset.status !== MediaStatus.READY ||
      asset.category !== category
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.MEDIA_NOT_USABLE,
        "The media asset does not exist, is not yours, is not uploaded yet, or is the wrong category.",
      );
    }
  }

  /** Public URL for a stored key, or null when storage is not configured. */
  publicUrl(storageKey: string): string | null {
    return this.storage.isConfigured ? this.storage.publicUrl(storageKey) : null;
  }

  toResponse(asset: MediaAsset): MediaAssetResponseDto {
    return {
      id: asset.id,
      url: asset.status === MediaStatus.READY ? this.publicUrl(asset.storageKey) : null,
      category: asset.category,
      status: asset.status,
      originalFileName: asset.originalFileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
      altText: asset.altText,
      uploadedAt: asset.uploadedAt,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  }

  /** Owner or ADMIN. Anyone else gets 404 so asset ids cannot be probed. */
  private async findAccessible(user: AuthUser, id: string): Promise<MediaAsset> {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset || (asset.ownerId !== user.id && user.role !== UserRole.ADMIN)) {
      throw new ApiException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "Media asset not found.");
    }
    return asset;
  }

  private async deleteStoredObject(storageKey: string): Promise<void> {
    if (!this.storage.isConfigured) return;
    await this.storage.deleteObject(storageKey).catch((error: unknown) => {
      this.logger.error({ err: error, storageKey }, "Orphaned object left in storage");
    });
  }

  /** Deletes an upload that failed verification, then reports why. */
  private async reject(asset: MediaAsset, message: string): Promise<never> {
    this.logger.warn({ mediaAssetId: asset.id, reason: message }, "Media upload rejected");
    await this.storage.deleteObject(asset.storageKey).catch((error: unknown) => {
      this.logger.error(
        { err: error, storageKey: asset.storageKey },
        "Failed to delete rejected upload",
      );
    });
    await this.prisma.mediaAsset.deleteMany({
      where: { id: asset.id, status: MediaStatus.PENDING },
    });
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.MEDIA_UPLOAD_INVALID,
      message,
    );
  }

  async handleStreamUpload(
    key: string,
    expires: number,
    sig: string,
    stream: NodeJS.ReadableStream,
    contentType?: string,
  ): Promise<void> {
    this.assertStorage();
    if (!this.storage.verifyUploadToken || !this.storage.handleUpload) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        "Streaming uploads are not supported by the active storage provider.",
      );
    }

    if (!this.storage.verifyUploadToken(key, expires, sig)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        "The upload URL signature is invalid or has expired.",
      );
    }

    await this.storage.handleUpload(key, stream, contentType);
  }

  private assertStorage(): void {
    if (!this.storage.isConfigured) throw notConfigured();
  }
}
