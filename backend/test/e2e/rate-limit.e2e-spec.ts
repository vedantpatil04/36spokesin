// Enable rate limiting for this file only, before the application module is imported.
vi.hoisted(() => {
  process.env["RATE_LIMIT_ENABLED"] = "true";
  process.env["RATE_LIMIT_AUTH_MAX"] = "3";
  process.env["RATE_LIMIT_MAX"] = "1000";
});

import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Rate limiting", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("applies the stricter limit to credential endpoints", async () => {
    const attempt = () =>
      ctx.http
        .post(`${API}/auth/login`)
        .send({ email: "nobody@example.com", password: "whatever-pass" });

    for (let i = 0; i < 3; i += 1) await attempt().expect(401);
    const limited = await attempt().expect(429);
    expect(limited.body.error.code).toBe("TOO_MANY_REQUESTS");
  });

  it("does not throttle health checks", async () => {
    for (let i = 0; i < 10; i += 1) await ctx.http.get(`${API}/health/live`).expect(200);
  });
});
