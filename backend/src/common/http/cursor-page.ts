export interface CursorPageMeta {
  /** Pass as `cursor` to fetch the next page. Null on the last page. */
  nextCursor: string | null;
  limit: number;
}

/**
 * A page of results. The response interceptor renders it as
 * `{ data: items, meta: { nextCursor, limit } }`.
 */
export class CursorPage<T> {
  constructor(
    readonly items: T[],
    readonly meta: CursorPageMeta,
  ) {}

  /** Builds a page from up to `limit + 1` rows fetched in list order. */
  static fromRows<Row extends { id: string }, T>(
    rows: Row[],
    limit: number,
    map: (row: Row) => T,
  ): CursorPage<T> {
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows.at(-1);
    return new CursorPage(pageRows.map(map), {
      nextCursor: hasMore && last ? last.id : null,
      limit,
    });
  }
}
