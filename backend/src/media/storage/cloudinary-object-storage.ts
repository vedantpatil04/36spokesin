import { HttpStatus, Logger } from "@nestjs/common";
import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from "cloudinary";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Transform } from "node:stream";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { CloudinaryConfig } from "../../config/app-config.service.js";
import { isSafeStorageKey } from "../storage-key.js";
import type { ObjectStorage, PresignedUpload, StoredObjectInfo } from "./object-storage.js";

const MAX_CACHED_HEAD = 128 * 1024;

/**
 * Cloudinary storage adapter for local development and testing.
 * Implements the standard ObjectStorage interface:
 *   - createPresignedUpload: returns a signed upload URL to this server's streaming endpoint
 *   - handleUpload: streams raw file bytes directly to Cloudinary (image or video)
 *   - getObjectInfo / readObjectStart: verifies size, magic bytes and dimensions
 *   - deleteObject: safely destroys assets in Cloudinary
 *   - publicUrl: returns the canonical, persistent HTTPS CDN URL
 */
export class CloudinaryObjectStorage implements ObjectStorage {
  readonly isConfigured = true;
  private readonly logger = new Logger(CloudinaryObjectStorage.name);
  private readonly headCache = new Map<string, Buffer>();
  private readonly infoCache = new Map<string, StoredObjectInfo>();

  constructor(
    private readonly config: CloudinaryConfig,
    private readonly apiUrl: string,
  ) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds: number;
  }): Promise<PresignedUpload> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    const expiresTimestamp = expiresAt.getTime();
    const sig = this.signUploadToken(input.key, expiresTimestamp);
    const url = `${this.apiUrl}/api/v1/media/uploads/content?key=${encodeURIComponent(
      input.key,
    )}&expires=${expiresTimestamp}&sig=${sig}`;

    return {
      url,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt,
    };
  }

  verifyUploadToken(key: string, expires: number, sig: string): boolean {
    if (!isSafeStorageKey(key)) return false;
    if (Date.now() > expires) return false;
    const expected = this.signUploadToken(key, expires);
    if (sig.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  async handleUpload(
    key: string,
    stream: NodeJS.ReadableStream,
    contentType?: string,
  ): Promise<void> {
    const isVideo = isVideoKey(key) || (contentType ? contentType.startsWith("video/") : false);
    const resourceType = isVideo ? "video" : "image";
    const publicId = keyToPublicId(key);

    const options: UploadApiOptions = {
      public_id: publicId,
      resource_type: resourceType,
      overwrite: true,
      unique_filename: false,
      use_filename: false,
      invalidate: true,
    };

    const headChunks: Buffer[] = [];
    let headBytes = 0;

    const headTransform = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        if (headBytes < MAX_CACHED_HEAD) {
          const needed = MAX_CACHED_HEAD - headBytes;
          headChunks.push(chunk.subarray(0, needed));
          headBytes += Math.min(chunk.length, needed);
        }
        callback(null, chunk);
      },
    });

    const uploadPromise = new Promise<UploadApiResponse>((resolve, reject) => {
      const cloudStream = cloudinary.uploader.upload_stream(options, (err, res) => {
        if (err) return reject(err);
        if (!res) return reject(new Error("No response from Cloudinary upload stream"));
        resolve(res);
      });

      cloudStream.on("error", reject);
      headTransform.on("error", reject);
      stream.on("error", (err) => {
        cloudStream.destroy(err);
        reject(err);
      });

      stream.pipe(headTransform).pipe(cloudStream);
    });

    try {
      const result = await uploadPromise;
      if (headChunks.length > 0) {
        this.pruneCaches();
        this.headCache.set(key, Buffer.concat(headChunks));
      }
      this.infoCache.set(key, {
        contentLength: result.bytes,
        contentType: contentType ?? extensionToMime(key),
        width: result.width ?? null,
        height: result.height ?? null,
      });
      this.logger.log(
        { key, publicId, resourceType, bytes: result.bytes },
        "Cloudinary upload succeeded",
      );
    } catch (error) {
      this.logger.error({ err: error, key, publicId }, "Cloudinary stream upload failed");
      throw this.unavailable(error, "upload");
    }
  }

  async getObjectInfo(key: string): Promise<StoredObjectInfo | null> {
    const cached = this.infoCache.get(key);
    if (cached) return cached;

    const publicId = keyToPublicId(key);
    const isVideo = isVideoKey(key);
    const resourceType = isVideo ? "video" : "image";

    try {
      const res = (await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })) as {
        bytes?: number;
        width?: number;
        height?: number;
        format?: string;
      };

      const info: StoredObjectInfo = {
        contentLength: res.bytes ?? 0,
        contentType: extensionToMime(key),
        width: res.width ?? null,
        height: res.height ?? null,
      };
      this.infoCache.set(key, info);
      return info;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw this.unavailable(error, "getObjectInfo");
    }
  }

  async readObjectStart(key: string, length: number): Promise<Uint8Array> {
    const cached = this.headCache.get(key);
    if (cached) {
      return new Uint8Array(cached.subarray(0, length));
    }

    try {
      const url = this.publicUrl(key);
      const res = await fetch(url, {
        headers: { Range: `bytes=0-${length - 1}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to read from Cloudinary delivery URL: HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer.slice(0, length));
    } catch (error) {
      throw this.unavailable(error, "read");
    }
  }

  async deleteObject(key: string): Promise<void> {
    this.headCache.delete(key);
    this.infoCache.delete(key);
    const publicId = keyToPublicId(key);
    const isVideo = isVideoKey(key);
    const resourceType = isVideo ? "video" : "image";

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true,
      });
    } catch (error) {
      if (isNotFound(error)) return;
      throw this.unavailable(error, "delete");
    }
  }

  publicUrl(key: string): string {
    const isVideo = isVideoKey(key);
    const resourceType = isVideo ? "video" : "image";
    return `https://res.cloudinary.com/${this.config.cloudName}/${resourceType}/upload/${key}`;
  }

  private signUploadToken(key: string, expires: number): string {
    return createHmac("sha256", this.config.apiSecret)
      .update(`${key}:${expires}`)
      .digest("hex");
  }

  private pruneCaches(): void {
    if (this.headCache.size > 50) {
      const firstKey = this.headCache.keys().next().value;
      if (firstKey) this.headCache.delete(firstKey);
    }
    if (this.infoCache.size > 100) {
      const firstKey = this.infoCache.keys().next().value;
      if (firstKey) this.infoCache.delete(firstKey);
    }
  }

  private unavailable(error: unknown, operation: string): ApiException {
    this.logger.error({ err: error, operation }, "Cloudinary storage request failed");
    return new ApiException(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
      "Media storage is temporarily unavailable.",
    );
  }
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as { http_code?: number; error?: { http_code?: number }; message?: string };
  return (
    anyErr.http_code === 404 ||
    anyErr.error?.http_code === 404 ||
    (typeof anyErr.message === "string" && anyErr.message.toLowerCase().includes("not found"))
  );
}

function isVideoKey(key: string): boolean {
  return /\.(mp4|webm|mov|ogg)$/i.test(key);
}

function keyToPublicId(key: string): string {
  return key.replace(/\.[^/.]+$/, "");
}

function extensionToMime(key: string): string | null {
  const match = key.match(/\.([a-z0-9]+)$/i);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    default:
      return null;
  }
}
