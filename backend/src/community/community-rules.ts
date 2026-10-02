import { invalidReference } from "../catalog/unique-slug.js";

/** Rows as they are displayed now: `sortOrder`, then creation order. */
export type OrderedRow = { id: string; sortOrder: number };

/**
 * The sort-order writes for a reorder request. Listed ids come first, in the
 * given order; rows that were not listed keep their relative order after them.
 * Only rows whose position actually changes are returned. Unknown ids are
 * rejected (422) so a stale screen can never write half an order.
 */
export function planReorder(current: OrderedRow[], ids: string[]): OrderedRow[] {
  const known = new Set(current.map((row) => row.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw invalidReference(
      "ids",
      `Unknown id${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}.`,
    );
  }
  const listed = new Set(ids);
  const order = [...ids, ...current.filter((row) => !listed.has(row.id)).map((row) => row.id)];
  const previous = new Map(current.map((row) => [row.id, row.sortOrder]));
  return order.flatMap((id, sortOrder) =>
    previous.get(id) === sortOrder ? [] : [{ id, sortOrder }],
  );
}

/** Position for a new row: after every existing one. */
export const nextSortOrder = (highest: { sortOrder: number } | null) =>
  highest ? highest.sortOrder + 1 : 0;

/** Copies the listed nullable fields that were sent (null clears them). */
export function nullable<T extends object, K extends keyof T>(
  dto: T,
  keys: K[],
): Partial<Pick<T, K>> {
  return Object.fromEntries(
    keys.filter((key) => dto[key] !== undefined).map((key) => [key, dto[key]]),
  ) as Partial<Pick<T, K>>;
}

/** Display order used everywhere for sortable community content. */
export const DISPLAY_ORDER = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];
