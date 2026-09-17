import { HttpStatus } from "@nestjs/common";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { ObjectStorage } from "./object-storage.js";

/** Stand-in when R2 variables are absent: the API boots, media operations return 503. */
export class UnconfiguredObjectStorage implements ObjectStorage {
  readonly isConfigured = false;

  createPresignedUpload(): never {
    throw notConfigured();
  }

  getObjectInfo(): never {
    throw notConfigured();
  }

  readObjectStart(): never {
    throw notConfigured();
  }

  deleteObject(): never {
    throw notConfigured();
  }

  publicUrl(): never {
    throw notConfigured();
  }
}

export function notConfigured(): ApiException {
  return new ApiException(
    HttpStatus.SERVICE_UNAVAILABLE,
    ErrorCode.STORAGE_NOT_CONFIGURED,
    "Media storage is not configured on this server.",
  );
}
