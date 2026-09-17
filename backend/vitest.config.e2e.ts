import { defineConfig } from "vitest/config";

// End-to-end tests: the real Nest application against a real PostgreSQL database
// (TEST_DATABASE_URL). Object storage is replaced with an in-memory fake.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    globalSetup: ["test/e2e/global-setup.ts"],
    setupFiles: ["test/e2e/setup-env.ts"],
    // Files share one database, so they run one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
