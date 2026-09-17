// Runs before each e2e test file (and before its imports are evaluated).
try {
  process.loadEnvFile();
} catch {
  // No .env file.
}

const testDatabaseUrl = process.env["TEST_DATABASE_URL"];
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL is not set");

// Start from a clean slate so a developer's R2 or CORS settings never leak in.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("R2_") || key.startsWith("RATE_LIMIT_") || key.startsWith("AUTH_COOKIE_")) {
    delete process.env[key];
  }
}

Object.assign(process.env, {
  NODE_ENV: "test",
  DATABASE_URL: testDatabaseUrl,
  WEB_URL: "http://localhost:8080",
  CORS_ORIGINS: "http://localhost:8080",
  JWT_SECRET: "test-access-secret-0123456789abcdefghijklmnopqrstuvwxyz",
  JWT_REFRESH_SECRET: "test-refresh-secret-0123456789abcdefghijklmnopqrstuvwxyz",
  RATE_LIMIT_ENABLED: "false",
  MEDIA_MAX_UPLOAD_BYTES: String(1024 * 1024),
  LOG_LEVEL: "silent",
});
