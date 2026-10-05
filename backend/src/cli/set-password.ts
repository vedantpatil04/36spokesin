import "reflect-metadata";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PasswordService } from "../auth/password.service.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { UserRole } from "../generated/prisma/enums.js";

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {}

  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      password: { type: "string" },
      role: { type: "string", default: "ADMIN" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const password = values.password ?? process.env["ADMIN_PASSWORD"];

  if (!email || !password) {
    throw new Error("Usage: npx tsx src/cli/set-password.ts --email <email> --password <password>");
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
    const existing = await prisma.user.findUnique({ where: { email } });
    const passwordHash = await new PasswordService().hash(password);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          role: values.role === "ADMIN" ? UserRole.ADMIN : existing.role,
          isActive: true,
        },
      });
      console.log(`Updated password and set ADMIN role for existing user: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: "Admin",
          role: UserRole.ADMIN,
          isActive: true,
          riderProfile: { create: {} },
        },
      });
      console.log(`Created new ADMIN user: ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
