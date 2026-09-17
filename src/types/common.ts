/**
 * Primitive aliases shared by every model.
 *
 * These are plain strings/numbers at runtime. The aliases document intent so the
 * Phase 3 database schema (and any generated Supabase types) can be mapped 1:1.
 */

/** Stable identifier. Mock data uses readable ids; the backend will use UUIDs. */
export type ID = string;

/** URL-safe, human-readable identifier used in routes (e.g. `/stories/$slug`). */
export type Slug = string;

/** Calendar date, `YYYY-MM-DD`. */
export type ISODate = string;

/** Year and month, `YYYY-MM`. */
export type ISOYearMonth = string;

/** Full timestamp, ISO 8601 (e.g. `2026-10-17T05:30:00+05:30`). */
export type ISODateTime = string;

/** Whole Indian rupees. Payment integrations convert to paise at the boundary. */
export type RupeeAmount = number;

export type Difficulty = "Easy" | "Moderate" | "Challenging" | "Expert";
