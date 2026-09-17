import { API, type TestContext, createTestApp } from "./helpers/test-app.js";

describe("Health and API conventions", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("reports the API and database as up without authentication", async () => {
    const response = await ctx.http.get(`${API}/health`).expect(200);

    expect(response.body.data).toMatchObject({
      status: "ok",
      checks: { database: "up", storage: "not_configured" },
    });
    expect(typeof response.body.data.uptimeSeconds).toBe("number");
  });

  it("serves a dependency-free liveness probe", async () => {
    await ctx.http.get(`${API}/health/live`).expect(200, { data: { status: "ok" } });
  });

  it("assigns a request id, or echoes a well-formed incoming one", async () => {
    const generated = await ctx.http.get(`${API}/health/live`);
    expect(generated.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);

    const echoed = await ctx.http.get(`${API}/health/live`).set("X-Request-Id", "trace-abc-12345");
    expect(echoed.headers["x-request-id"]).toBe("trace-abc-12345");
  });

  it("uses the standard error body for unknown routes", async () => {
    const response = await ctx.http.get(`${API}/does-not-exist`).expect(404);
    expect(response.body.error).toMatchObject({
      statusCode: 404,
      code: "NOT_FOUND",
      path: `${API}/does-not-exist`,
    });
    expect(response.body.error.requestId).toBeDefined();
    expect(JSON.stringify(response.body)).not.toMatch(/stack|at .*\.js/);
  });

  it("only serves versioned routes", async () => {
    await ctx.http.get("/api/health").expect(404);
  });

  it("rejects malformed JSON without echoing parser details", async () => {
    const response = await ctx.http
      .post(`${API}/auth/login`)
      .set("Content-Type", "application/json")
      .send("{not json")
      .expect(400);
    expect(response.body.error.message).toBe("The request is malformed.");
  });

  it("rejects oversized request bodies", async () => {
    const response = await ctx.http
      .post(`${API}/auth/login`)
      .send({ email: "a".repeat(200_000), password: "x" })
      .expect(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("allows configured browser origins and ignores others", async () => {
    const allowed = await ctx.http
      .options(`${API}/auth/login`)
      .set("Origin", "http://localhost:8080")
      .set("Access-Control-Request-Method", "POST");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:8080");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const denied = await ctx.http
      .options(`${API}/auth/login`)
      .set("Origin", "https://evil.example")
      .set("Access-Control-Request-Method", "POST");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("sends security headers", async () => {
    const response = await ctx.http.get(`${API}/health/live`);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });
});
