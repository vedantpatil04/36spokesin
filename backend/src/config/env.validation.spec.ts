import { NodeEnv, validateEnv } from "./env.validation.js";

const base = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  JWT_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

describe("validateEnv", () => {
  it("applies defaults and converts types", () => {
    const env = validateEnv({ ...base, PORT: "4000", RATE_LIMIT_ENABLED: "false" });
    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(4000);
    expect(env.RATE_LIMIT_ENABLED).toBe(false);
    expect(env.JWT_ACCESS_TTL_SECONDS).toBe(900);
    expect(env.MEDIA_MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
  });

  it("treats empty optional values as unset", () => {
    const env = validateEnv({ ...base, R2_BUCKET_NAME: "", AUTH_COOKIE_SECURE: "" });
    expect(env.R2_BUCKET_NAME).toBeUndefined();
    expect(env.AUTH_COOKIE_SECURE).toBeUndefined();
  });

  it("requires strong, distinct JWT secrets", () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ ...base, JWT_REFRESH_SECRET: base.JWT_SECRET })).toThrow(
      /different/,
    );
    expect(() => validateEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it("rejects partially configured storage", () => {
    expect(() => validateEnv({ ...base, R2_BUCKET_NAME: "media" })).toThrow(/partially configured/);
    expect(() =>
      validateEnv({
        ...base,
        R2_ACCOUNT_ID: "acc",
        R2_ACCESS_KEY_ID: "key",
        R2_SECRET_ACCESS_KEY: "secret",
        R2_BUCKET_NAME: "media",
        R2_PUBLIC_BASE_URL: "https://media.36spokes.in",
      }),
    ).not.toThrow();
  });

  it("refuses unsafe production settings", () => {
    const production = { ...base, NODE_ENV: "production" };
    expect(() => validateEnv({ ...production, CORS_ORIGINS: "https://36spokes.in,*" })).toThrow(
      /CORS/,
    );
    expect(() => validateEnv({ ...production, AUTH_COOKIE_SECURE: "false" })).toThrow(/SECURE/);
    expect(() => validateEnv({ ...production, CORS_ORIGINS: "https://36spokes.in" })).not.toThrow();
  });
});
