import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Role-based authorization", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("forbids riders from admin endpoints", async () => {
    const rider = await registerUser(ctx.http);
    const response = await ctx.http.get(`${API}/users`).set(bearer(rider.accessToken)).expect(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    await ctx.http.get(`${API}/users/${rider.id}`).set(bearer(rider.accessToken)).expect(403);
  });

  it("requires authentication before checking roles", async () => {
    await ctx.http.get(`${API}/users`).expect(401);
  });

  it("lets admins list accounts with cursor pagination", async () => {
    const admin = await registerAdmin(ctx.http, ctx.prisma);
    for (let i = 0; i < 3; i += 1) await registerUser(ctx.http);

    const firstPage = await ctx.http
      .get(`${API}/users`)
      .query({ limit: 2 })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.meta).toEqual({ nextCursor: expect.any(String), limit: 2 });

    const secondPage = await ctx.http
      .get(`${API}/users`)
      .query({ limit: 2, cursor: firstPage.body.meta.nextCursor })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(secondPage.body.data).toHaveLength(2);
    expect(secondPage.body.meta.nextCursor).toBeNull();

    const ids = [...firstPage.body.data, ...secondPage.body.data].map(
      (user: { id: string }) => user.id,
    );
    expect(new Set(ids).size).toBe(4);

    const riders = await ctx.http
      .get(`${API}/users`)
      .query({ role: "RIDER" })
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(riders.body.data).toHaveLength(3);
  });

  it("validates pagination and route parameters", async () => {
    const admin = await registerAdmin(ctx.http, ctx.prisma);
    await ctx.http
      .get(`${API}/users`)
      .query({ limit: 500 })
      .set(bearer(admin.accessToken))
      .expect(400);
    await ctx.http
      .get(`${API}/users`)
      .query({ cursor: "nope" })
      .set(bearer(admin.accessToken))
      .expect(400);
    await ctx.http
      .get(`${API}/users`)
      .query({ role: "SUPERUSER" })
      .set(bearer(admin.accessToken))
      .expect(400);
    await ctx.http.get(`${API}/users/not-a-uuid`).set(bearer(admin.accessToken)).expect(400);
  });

  it("lets admins fetch any account and returns 404 for unknown ids", async () => {
    const admin = await registerAdmin(ctx.http, ctx.prisma);
    const rider = await registerUser(ctx.http);
    const response = await ctx.http
      .get(`${API}/users/${rider.id}`)
      .set(bearer(admin.accessToken))
      .expect(200);
    expect(response.body.data.email).toBe(rider.email);

    await ctx.http
      .get(`${API}/users/01999999-9999-7999-8999-999999999999`)
      .set(bearer(admin.accessToken))
      .expect(404);
  });
});
