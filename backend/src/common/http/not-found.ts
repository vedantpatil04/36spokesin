import { HttpStatus } from "@nestjs/common";
import { ApiException } from "../errors/api-exception.js";
import { ErrorCode } from "../errors/error-codes.js";

export function notFound(entity: string): ApiException {
  return new ApiException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, `${entity} not found.`);
}
