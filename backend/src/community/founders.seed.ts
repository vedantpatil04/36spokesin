import type { PrismaClient } from "../generated/prisma/client.js";
import { ContentStatus } from "../generated/prisma/enums.js";

/**
 * The confirmed founders of 36 Spokes. Names only: roles, bios, stories,
 * quotes, links and photos are supplied by the business through the admin CMS.
 */
export const CONFIRMED_FOUNDERS = ["Abhishek Sharma", "Simran Khaturia"] as const;

/**
 * Inserts the confirmed founders only when the founders table is empty
 * (archived rows count, so an admin's changes are never undone). Returns how
 * many rows were created. The Phase 6 migration applies the same rule once in
 * every database; this covers development databases emptied afterwards.
 */
export async function seedFoundersIfEmpty(
  prisma: Pick<PrismaClient, "$transaction">,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    if ((await tx.founder.count()) > 0) return 0;
    await tx.founder.createMany({
      data: CONFIRMED_FOUNDERS.map((name, sortOrder) => ({
        name,
        sortOrder,
        status: ContentStatus.PUBLISHED,
      })),
    });
    return CONFIRMED_FOUNDERS.length;
  });
}
