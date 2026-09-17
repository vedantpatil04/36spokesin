import { Injectable } from "@nestjs/common";
import type { MediaAsset } from "../../generated/prisma/client.js";

/**
 * Hook invoked once an upload is verified. Today it does nothing. Later it can
 * enqueue thumbnail / WebP / AVIF generation or extract focal points (e.g. through
 * a queue worker or Cloudflare Images) without changing the upload flow.
 * Implementations must not throw for work that can be retried later.
 */
export interface MediaProcessor {
  onAssetReady(asset: MediaAsset): Promise<void>;
}

export const MEDIA_PROCESSOR = Symbol("MEDIA_PROCESSOR");

@Injectable()
export class NoopMediaProcessor implements MediaProcessor {
  async onAssetReady(): Promise<void> {}
}
