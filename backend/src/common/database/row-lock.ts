import type { Prisma } from "../../generated/prisma/client.js";

/**
 * Tables whose rows are locked to serialise edits of their children (product
 * images, a rider's primary bike). Listed explicitly so no caller can build SQL
 * from an arbitrary string.
 */
const LOCKABLE_TABLES = {
  products: "products",
  users: "users",
  destinations: "destinations",
  trips: "trips",
  rides: "rides",
} as const;

export type LockableTable = keyof typeof LOCKABLE_TABLES;

/**
 * Takes a row lock inside an interactive transaction and reports whether the row
 * exists. Concurrent transactions touching the same parent wait here, so
 * multi-row invariants (one primary image, contiguous ordering) hold.
 */
export async function lockRow(
  tx: Prisma.TransactionClient,
  table: LockableTable,
  id: string,
): Promise<boolean> {
  const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "${LOCKABLE_TABLES[table]}" WHERE id = $1::uuid FOR UPDATE`,
    id,
  );
  return rows.length > 0;
}
