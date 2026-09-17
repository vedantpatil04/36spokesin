/**
 * Creates the first administrator, or promotes an existing account.
 *
 *   ADMIN_PASSWORD='…' npm run admin:create -- --email you@36spokes.in --first-name Ved
 *   (production image: ADMIN_PASSWORD='…' node dist/cli/create-admin.js --email …)
 *
 * The password is read from the environment, never from arguments, so it does not
 * land in shell history. An existing account keeps its password and becomes ADMIN.
 */
import "reflect-metadata";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { PasswordService } from "../auth/password.service.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { UserRole } from "../generated/prisma/enums.js";

const ADMIN_PASSWORD_MIN_LENGTH = 12;

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file; use the process environment.
  }

  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      "first-name": { type: "string", default: "Admin" },
      "last-name": { type: "string" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Pass a valid --email");
  }
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: UserRole.ADMIN, isActive: true },
      });
      console.log(`Promoted ${email} to ADMIN.`);
      return;
    }

    const password = process.env["ADMIN_PASSWORD"] ?? "";
    if (password.length < ADMIN_PASSWORD_MIN_LENGTH) {
      throw new Error(`Set ADMIN_PASSWORD (at least ${ADMIN_PASSWORD_MIN_LENGTH} characters)`);
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash: await new PasswordService().hash(password),
        firstName: values["first-name"] ?? "Admin",
        lastName: values["last-name"] ?? null,
        role: UserRole.ADMIN,
        riderProfile: { create: {} },
      },
    });
    console.log(`Created ADMIN account ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
