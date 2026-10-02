import { defineConfig } from "prisma/config";

// Prisma 7 does not load .env files. Load one if present; real environments
// provide DATABASE_URL directly.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the process environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Development bootstrap data. Only ever run explicitly (`npm run db:seed` or
    // `prisma db seed`); never on start-up or deploy.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` does not connect, so an empty value is fine at build time.
    url: process.env["DATABASE_URL"] ?? "",
  },
});
