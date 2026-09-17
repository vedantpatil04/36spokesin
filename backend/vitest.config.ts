import { defineConfig } from "vitest/config";

// Unit tests: pure logic, no database or network.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
