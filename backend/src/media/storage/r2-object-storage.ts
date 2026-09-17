import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpStatus, Logger } from "@nestjs/common";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { StorageConfig } from "../../config/app-config.service.js";
import type { ObjectStorage, PresignedUpload, StoredObjectInfo } from "./object-storage.js";

/** Cloudflare R2 through its S3-compatible API. */
export class R2ObjectStorage implements ObjectStorage {
  readonly isConfigured = true;
  private readonly logger = new Logger(R2ObjectStorage.name);
  private readonly client: S3Client;

  constructor(private readonly config: StorageConfig) {
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // R2 does not accept the SDK's default flexible checksums on presigned uploads.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds: number;
  }): Promise<PresignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    });
    // Signing Content-Type and Content-Length means storage rejects an upload whose
    // type or size differs from what the API authorised.
    const url = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSeconds,
      signableHeaders: new Set(["content-type", "content-length"]),
    });
    return {
      url,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }

  async getObjectInfo(key: string): Promise<StoredObjectInfo | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.config.bucket, Key: key }),
      );
      return { contentLength: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw this.unavailable(error, "head");
    }
  }

  async readObjectStart(key: string, length: number): Promise<Uint8Array> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Range: `bytes=0-${length - 1}`,
        }),
      );
      return result.Body ? await result.Body.transformToByteArray() : new Uint8Array();
    } catch (error) {
      throw this.unavailable(error, "read");
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
    } catch (error) {
      if (isNotFound(error)) return;
      throw this.unavailable(error, "delete");
    }
  }

  publicUrl(key: string): string {
    return `${this.config.publicBaseUrl}/${key}`;
  }

  private unavailable(error: unknown, operation: string): ApiException {
    this.logger.error({ err: error, operation }, "Object storage request failed");
    return new ApiException(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
      "Media storage is temporarily unavailable.",
    );
  }
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof S3ServiceException &&
    (error.name === "NotFound" ||
      error.name === "NoSuchKey" ||
      error.$metadata.httpStatusCode === 404)
  );
}
