import { REFRESH_REUSE_GRACE_MS } from "../../src/auth/auth.constants.js";
import { bearer, extractRefreshCookie, registerUser } from "./helpers/fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Authentication", () => {
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

  describe("registration", () => {
    it("creates a rider with a hashed password and a rider profile, and signs them in", async () => {
      const response = await ctx.http
        .post(`${API}/auth/register`)
        .send({
          email: "  New.Rider@Example.COM ",
          password: "correct-horse-battery",
          firstName: " Aarav ",
          lastName: "Sharma",
          phone: "+91 98765-43210",
        })
        .expect(201);

      const { data } = response.body;
      expect(data.user).toMatchObject({
        email: "new.rider@example.com",
        firstName: "Aarav",
        phone: "+919876543210",
        role: "RIDER",
        isActive: true,
        emailVerified: false,
      });
      expect(data.tokenType).toBe("Bearer");
      expect(data.expiresIn).toBe(900);
      expect(data.accessToken).toEqual(expect.any(String));
      expect(data.refreshToken).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain("passwordHash");

      const cookie = String(response.headers["set-cookie"]);
      expect(cookie).toMatch(/spokes_rt=[\w-]{40,}/);
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("Path=/api/v1/auth");
      expect(cookie).toContain("SameSite=Lax");

      const stored = await ctx.prisma.user.findUniqueOrThrow({
        where: { email: "new.rider@example.com" },
        include: { riderProfile: true, sessions: true },
      });
      expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
      expect(stored.passwordHash).not.toContain("correct-horse-battery");
      expect(stored.riderProfile).not.toBeNull();
      expect(stored.sessions).toHaveLength(1);
      expect(stored.sessions[0]?.tokenHash).not.toBe(
        extractRefreshCookie(response.headers["set-cookie"]),
      );
    });

    it("returns field-level validation errors and rejects unknown properties", async () => {
      const response = await ctx.http
        .post(`${API}/auth/register`)
        .send({ email: "not-an-email", password: "short", firstName: "", role: "ADMIN" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_FAILED");
      const fields = response.body.error.details.map((detail: { field: string }) => detail.field);
      expect(fields).toEqual(expect.arrayContaining(["email", "password", "firstName", "role"]));
      expect(await ctx.prisma.user.count()).toBe(0);
    });

    it("rejects a duplicate email regardless of case", async () => {
      await registerUser(ctx.http, { email: "taken@example.com" });
      const response = await ctx.http
        .post(`${API}/auth/register`)
        .send({ email: "TAKEN@example.com", password: "another-password", firstName: "B" })
        .expect(409);
      expect(response.body.error.code).toBe("EMAIL_ALREADY_REGISTERED");
    });
  });

  describe("login", () => {
    it("signs in with valid credentials", async () => {
      const user = await registerUser(ctx.http);
      const response = await ctx.http
        .post(`${API}/auth/login`)
        .send({ email: user.email.toUpperCase(), password: user.password })
        .expect(200);
      expect(response.body.data.user.id).toBe(user.id);
      expect(extractRefreshCookie(response.headers["set-cookie"])).toMatch(/^spokes_rt=/);
    });

    it("gives the same answer for a wrong password and an unknown account", async () => {
      const user = await registerUser(ctx.http);
      const wrongPassword = await ctx.http
        .post(`${API}/auth/login`)
        .send({ email: user.email, password: "not-the-password" })
        .expect(401);
      const unknown = await ctx.http
        .post(`${API}/auth/login`)
        .send({ email: "nobody@example.com", password: "not-the-password" })
        .expect(401);

      expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
      expect(unknown.body.error.message).toBe(wrongPassword.body.error.message);
    });

    it("refuses disabled accounts", async () => {
      const user = await registerUser(ctx.http);
      await ctx.prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
      const response = await ctx.http
        .post(`${API}/auth/login`)
        .send({ email: user.email, password: user.password })
        .expect(403);
      expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
    });
  });

  describe("protected routes", () => {
    it("rejects requests without a token", async () => {
      const response = await ctx.http.get(`${API}/users/me`).expect(401);
      expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("rejects malformed, tampered and wrongly-signed tokens", async () => {
      const user = await registerUser(ctx.http);
      const [header, payload] = user.accessToken.split(".");
      const forged = `${header}.${payload}.${"A".repeat(43)}`;

      await ctx.http.get(`${API}/users/me`).set(bearer("not-a-jwt")).expect(401);
      await ctx.http.get(`${API}/users/me`).set(bearer(forged)).expect(401);
      await ctx.http
        .get(`${API}/users/me`)
        .set("Authorization", `Basic ${user.accessToken}`)
        .expect(401);
    });

    it("returns the current user for a valid token", async () => {
      const user = await registerUser(ctx.http, { firstName: "Meera" });
      const response = await ctx.http
        .get(`${API}/users/me`)
        .set(bearer(user.accessToken))
        .expect(200);
      expect(response.body.data).toMatchObject({
        id: user.id,
        email: user.email,
        firstName: "Meera",
      });
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it("updates the current user's details", async () => {
      const user = await registerUser(ctx.http);
      const response = await ctx.http
        .patch(`${API}/users/me`)
        .set(bearer(user.accessToken))
        .send({ firstName: "Kabir", lastName: "", phone: "+14155550123" })
        .expect(200);
      expect(response.body.data).toMatchObject({
        firstName: "Kabir",
        lastName: null,
        phone: "+14155550123",
      });

      await ctx.http
        .patch(`${API}/users/me`)
        .set(bearer(user.accessToken))
        .send({ firstName: null, email: "hijack@example.com" })
        .expect(400);
    });
  });

  describe("refresh sessions", () => {
    it("rotates the refresh cookie and issues a new access token", async () => {
      const user = await registerUser(ctx.http);

      const response = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .set("Origin", "http://localhost:8080")
        .expect(200);

      const rotatedCookie = extractRefreshCookie(response.headers["set-cookie"]);
      expect(rotatedCookie).not.toBe(user.refreshCookie);
      expect(response.body.data.user.id).toBe(user.id);
      await ctx.http.get(`${API}/users/me`).set(bearer(response.body.data.accessToken)).expect(200);

      // The rotated token works; the session is a single row.
      await ctx.http.post(`${API}/auth/refresh`).set("Cookie", rotatedCookie).expect(200);
      expect(await ctx.prisma.authSession.count({ where: { userId: user.id } })).toBe(1);
    });

    it("treats an immediate replay of the previous token as a race, not theft", async () => {
      const user = await registerUser(ctx.http);
      const first = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .expect(200);
      const current = extractRefreshCookie(first.headers["set-cookie"]);

      const replay = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .expect(401);
      expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");

      await ctx.http.post(`${API}/auth/refresh`).set("Cookie", current).expect(200);
    });

    it("revokes the session when an old token is replayed after the grace window", async () => {
      const user = await registerUser(ctx.http);
      const first = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .expect(200);
      const current = extractRefreshCookie(first.headers["set-cookie"]);

      await ctx.prisma.authSession.updateMany({
        where: { userId: user.id },
        data: { rotatedAt: new Date(Date.now() - REFRESH_REUSE_GRACE_MS - 1000) },
      });

      await ctx.http.post(`${API}/auth/refresh`).set("Cookie", user.refreshCookie).expect(401);
      // Theft response: the legitimate holder is signed out too.
      await ctx.http.post(`${API}/auth/refresh`).set("Cookie", current).expect(401);
      const session = await ctx.prisma.authSession.findFirstOrThrow({ where: { userId: user.id } });
      expect(session.revokedAt).not.toBeNull();
    });

    it("rejects expired sessions and clears the cookie", async () => {
      const user = await registerUser(ctx.http);
      await ctx.prisma.authSession.updateMany({
        where: { userId: user.id },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const response = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .expect(401);
      expect(String(response.headers["set-cookie"])).toMatch(/spokes_rt=;/);
    });

    it("rejects cookie refreshes from origins that are not allowed", async () => {
      const user = await registerUser(ctx.http);
      await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .set("Origin", "https://evil.example")
        .expect(403);
    });

    it("stops refreshing once the account is disabled", async () => {
      const user = await registerUser(ctx.http);
      await ctx.prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
      const response = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("Cookie", user.refreshCookie)
        .expect(403);
      expect(response.body.error.code).toBe("ACCOUNT_DISABLED");
    });

    it("supports native clients with the refresh token in the body", async () => {
      const login = await ctx.http
        .post(`${API}/auth/register`)
        .set("X-Client-Platform", "native")
        .send({ email: "app@example.com", password: "correct-horse-battery", firstName: "App" })
        .expect(201);

      expect(login.headers["set-cookie"]).toBeUndefined();
      const { refreshToken } = login.body.data;
      expect(refreshToken).toEqual(expect.any(String));

      const refreshed = await ctx.http
        .post(`${API}/auth/refresh`)
        .set("X-Client-Platform", "native")
        .send({ refreshToken })
        .expect(200);
      expect(refreshed.body.data.refreshToken).not.toBe(refreshToken);
    });

    it("logs out by revoking the session and clearing the cookie", async () => {
      const user = await registerUser(ctx.http);
      const response = await ctx.http
        .post(`${API}/auth/logout`)
        .set("Cookie", user.refreshCookie)
        .expect(204);
      expect(String(response.headers["set-cookie"])).toMatch(/spokes_rt=;/);

      await ctx.http.post(`${API}/auth/refresh`).set("Cookie", user.refreshCookie).expect(401);
      // Idempotent.
      await ctx.http.post(`${API}/auth/logout`).set("Cookie", user.refreshCookie).expect(204);
      await ctx.http.post(`${API}/auth/logout`).expect(204);
    });

    it("rejects a refresh with no token at all", async () => {
      const response = await ctx.http.post(`${API}/auth/refresh`).expect(401);
      expect(response.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    });
  });
});
