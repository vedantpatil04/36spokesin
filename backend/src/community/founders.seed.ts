import type { PrismaClient } from "../generated/prisma/client.js";
import { ContentStatus } from "../generated/prisma/enums.js";

/**
 * The confirmed founders of 36 Spokes. Names only: roles, bios, stories,
 * quotes, links and photos are supplied by the business through the admin CMS.
 */
export const CONFIRMED_FOUNDERS = [
  { name: "Simran Khaturia", role: "Founder" },
  { name: "Abhishek Sharma", role: "Founder" },
  { name: "Mayitrayi Subhedar", role: "Founding Team" },
  { name: "Amol Drago", role: "Founding Team" },
  { name: "Chatur Singh", role: "Founding Team" },
  { name: "Geeta", role: "Founding Team" },
] as const;

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
      data: CONFIRMED_FOUNDERS.map((founder, sortOrder) => ({
        name: founder.name,
        role: founder.role,
        sortOrder,
        status: ContentStatus.PUBLISHED,
      })),
    });
    return CONFIRMED_FOUNDERS.length;
  });
}
