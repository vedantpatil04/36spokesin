import { HttpException, HttpStatus } from "@nestjs/common";
import type { ErrorCode } from "./error-codes.js";

export interface ErrorDetail {
  field: string;
  messages: string[];
}

/** An HTTP error with a stable code and a client-safe message. */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message, status);
  }
}
