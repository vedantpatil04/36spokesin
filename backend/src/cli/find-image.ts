import "reflect-metadata";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {}

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
    const assets = await prisma.mediaAsset.findMany({
      where: {
        storageKey: { contains: "080bc1fc" },
      },
    });
    console.log("MATCHING_MEDIA_ASSETS:", JSON.stringify(assets, null, 2));

    const heroSlides = await prisma.heroSlide.findMany({
      where: {
        OR: [
          { imageUrl: { contains: "080bc1fc" } },
          { posterUrl: { contains: "080bc1fc" } },
        ],
      },
    });
    console.log("MATCHING_HERO_SLIDES:", JSON.stringify(heroSlides, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
