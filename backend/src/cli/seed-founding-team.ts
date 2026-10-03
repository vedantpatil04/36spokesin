import "reflect-metadata";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { ContentStatus } from "../generated/prisma/enums.js";

const NEW_FOUNDERS = [
  { name: "Mayitrayi Subhedar", role: "Founding Team" },
  { name: "Amol Drago", role: "Founding Team" },
  { name: "Chatur Singh", role: "Founding Team" },
  { name: "Geeta Rotti", role: "Founding Team" },
];

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    // Process env
  }

  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const isSsl =
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("pooler.supabase.com");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  });

  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.founder.updateMany({
      where: { name: { in: ["Simran Kathuria", "Simran Khaturia", "Abhishek Sharma"] } },
      data: { role: "Founder" },
    });

    const existingFounders = await prisma.founder.findMany({
      orderBy: { sortOrder: "desc" },
    });

    let nextOrder = existingFounders.length > 0 ? (existingFounders[0]?.sortOrder ?? 0) + 1 : 0;

    for (const member of NEW_FOUNDERS) {
      const alreadyExists = existingFounders.some(
        (f) => f.name.toLowerCase().trim() === member.name.toLowerCase().trim(),
      );

      if (!alreadyExists) {
        const created = await prisma.founder.create({
          data: {
            name: member.name,
            role: member.role,
            status: ContentStatus.PUBLISHED,
            sortOrder: nextOrder++,
          },
        });
        console.log(`Created founder: ${created.name} (id: ${created.id}, role: ${created.role})`);
      } else {
        console.log(`Founder already exists: ${member.name}`);
      }
    }

    const all = await prisma.founder.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, role: true, sortOrder: true, status: true, imageMediaId: true },
    });
    console.log("Current founders in database:\n", JSON.stringify(all, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Failed to seed founding team:", error instanceof Error ? error.message : error);
  process.exit(1);
});
