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
  },
  datasource: {
    // `prisma generate` does not connect, so an empty value is fine at build time.
    url: process.env["DATABASE_URL"] ?? "",
  },
});
