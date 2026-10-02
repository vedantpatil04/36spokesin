import type { TransformFnParams } from "class-transformer";

/** Lower-case words joined by single hyphens, e.g. `upper-and-lower-crash-guard`. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 120;

/** "Upper & Lower Crash Guard" → "upper-lower-crash-guard". Empty input gives "". */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** Trims and lower-cases a client-supplied slug; empty becomes undefined so it is generated. */
export const normaliseSlug = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().toLowerCase();
  return trimmed === "" ? undefined : trimmed;
};

/** SKUs are stored upper-cased and trimmed so uniqueness is case-insensitive. */
export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,63}$/;

export const normaliseSku = ({ value }: TransformFnParams): unknown =>
  typeof value === "string" ? value.trim().toUpperCase() : value;
