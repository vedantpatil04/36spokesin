import type {
  ObjectStorage,
  PresignedUpload,
  StoredObjectInfo,
} from "../../../src/media/storage/object-storage.js";

interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

/** Test double for R2. `simulateUpload` plays the role of the client's direct PUT. */
export class InMemoryObjectStorage implements ObjectStorage {
  readonly isConfigured = true;
  readonly objects = new Map<string, StoredObject>();
  readonly deleted: string[] = [];

  async createPresignedUpload(input: {
    key: string;
    contentType: string;
    contentLength: number;
    expiresInSeconds: number;
  }): Promise<PresignedUpload> {
    return {
      url: `https://storage.test/bucket/${input.key}?X-Amz-Signature=fake`,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    };
  }

  simulateUpload(key: string, bytes: Uint8Array, contentType: string): void {
    this.objects.set(key, { bytes, contentType });
  }

  async getObjectInfo(key: string): Promise<StoredObjectInfo | null> {
    const object = this.objects.get(key);
    return object ? { contentLength: object.bytes.length, contentType: object.contentType } : null;
  }

  async readObjectStart(key: string, length: number): Promise<Uint8Array> {
    return this.objects.get(key)?.bytes.subarray(0, length) ?? new Uint8Array();
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
    this.deleted.push(key);
  }

  publicUrl(key: string): string {
    return `https://media.test/${key}`;
  }
}
