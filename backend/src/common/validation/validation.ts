import { HttpStatus, ParseUUIDPipe, ValidationPipe, type ValidationError } from "@nestjs/common";
import { ApiException, type ErrorDetail } from "../errors/api-exception.js";
import { ErrorCode } from "../errors/error-codes.js";

/**
 * Global input validation: unknown properties are rejected, payloads are
 * transformed into DTO instances, and failures use the standard error body.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
    exceptionFactory: (errors) =>
      new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        "Request validation failed.",
        flattenValidationErrors(errors),
      ),
  });
}

export function flattenValidationErrors(errors: ValidationError[], parent = ""): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = error.constraints ? [{ field, messages: Object.values(error.constraints) }] : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

/** Route-parameter UUID validation with the standard error body. */
export const ParseUuidPipe = new ParseUUIDPipe({
  exceptionFactory: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_FAILED,
      "Request validation failed.",
      [{ field: "id", messages: ["id must be a UUID"] }],
    ),
});
