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
    const slides = await prisma.heroSlide.findMany({
      include: {
        image: true,
        video: true,
        poster: true,
        mobileMedia: true,
      },
      orderBy: { sortOrder: "asc" },
    });
    console.log("HERO_SLIDES:" + JSON.stringify(slides, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
