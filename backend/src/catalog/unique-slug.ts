import { HttpStatus } from "@nestjs/common";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { slugify } from "../common/validation/slug.js";

/**
 * Picks the slug for a record: the one supplied (which must be free), or one
 * generated from `name` with a numeric suffix until it is free.
 */
export async function resolveSlug(options: {
  requested: string | undefined;
  name: string;
  isTaken: (slug: string) => Promise<boolean>;
  entity: string;
}): Promise<string> {
  if (options.requested) {
    if (await options.isTaken(options.requested)) throw slugTaken(options.entity);
    return options.requested;
  }
  const base = slugify(options.name) || "item";
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? base : `${base}-${attempt}`;
    if (!(await options.isTaken(candidate))) return candidate;
  }
  throw slugTaken(options.entity);
}

export function slugTaken(entity: string): ApiException {
  return new ApiException(
    HttpStatus.CONFLICT,
    ErrorCode.SLUG_TAKEN,
    `Another ${entity} already uses this URL slug. Choose a different one.`,
    [{ field: "slug", messages: ["slug is already in use"] }],
  );
}

export function invalidReference(field: string, message: string): ApiException {
  return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_REFERENCE, message, [
    { field, messages: [message] },
  ]);
}
