import type { TransformFnParams } from "class-transformer";

/** Trims strings; leaves other values for the validators to reject. */
export const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === "string" ? value.trim() : value;

/** Trims and lower-cases, for case-insensitive identifiers such as email. */
export const normaliseEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

/** Trims; an empty string becomes null so optional text fields can be cleared. */
export const trimToNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/** E.164-style phone number, e.g. +919876543210. Spaces and dashes are stripped first. */
export const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;

export const normalisePhone = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== "string") return value;
  const compact = value.replace(/[\s-]/g, "");
  return compact === "" ? null : compact;
};
