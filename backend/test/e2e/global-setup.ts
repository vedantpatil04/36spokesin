import { execSync } from "node:child_process";

/**
 * Applies migrations to the test database before the suite. Refuses to run
 * against a database whose name does not contain "test", because every test file
 * truncates the tables.
 */
export default function setup(): void {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file.
  }

  const url = process.env["TEST_DATABASE_URL"];
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a dedicated database, e.g. " +
        "postgresql://spokes:spokes@localhost:5432/spokes_test",
    );
  }

  const databaseName = new URL(url).pathname.replace(/^\//, "");
  if (!databaseName.includes("test")) {
    throw new Error(
      `Refusing to run e2e tests against "${databaseName}": the name must contain "test".`,
    );
  }

  if (process.env["E2E_SKIP_MIGRATE"] === "true") return;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
}
