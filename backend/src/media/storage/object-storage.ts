export interface PresignedUpload {
  url: string;
  method: "PUT";
  /** Headers the client must send with the upload. The body must be exactly the declared size. */
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface StoredObjectInfo {
  contentLength: number;
  contentType: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Object storage used by the media module. The production implementation is
 * Cloudflare R2 (S3 API); Cloudinary is supported for local development / testing;
 * tests substitute an in-memory fake. A future image pipeline or CDN URL builder
 * plugs in here without touching MediaService.
 */
export interface ObjectStorage {
  readonly isConfigured: boolean;
  createPresignedUpload(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds: number;
  }): Promise<PresignedUpload>;
  /** Null when the object does not exist. */
  getObjectInfo(key: string): Promise<StoredObjectInfo | null>;
  /** The first `length` bytes of the object (fewer if the object is smaller). */
  readObjectStart(key: string, length: number): Promise<Uint8Array>;
  /** Idempotent. */
  deleteObject(key: string): Promise<void>;
  publicUrl(key: string): string;
  /** Optional handler for providers that accept uploads streamed via the API server (e.g. Cloudinary) */
  handleUpload?(key: string, stream: NodeJS.ReadableStream, contentType?: string): Promise<void>;
  verifyUploadToken?(key: string, expires: number, token: string): boolean;
}

export const OBJECT_STORAGE = Symbol("OBJECT_STORAGE");
