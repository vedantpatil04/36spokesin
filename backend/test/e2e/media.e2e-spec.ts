import { InMemoryObjectStorage } from "./helpers/in-memory-storage.js";
import { TINY_PNG, bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Media uploads", () => {
  let ctx: TestContext;
  let storage: InMemoryObjectStorage;

  const pngUpload = (overrides: Record<string, unknown> = {}) => ({
    fileName: "../../etc/passwd/avatar.png",
    mimeType: "image/png",
    fileSize: TINY_PNG.length,
    category: "RIDER",
    altText: "Rider portrait",
    ...overrides,
  });

  async function startUpload(token: string, overrides: Record<string, unknown> = {}) {
    const response = await ctx.http
      .post(`${API}/media/uploads`)
      .set(bearer(token))
      .send(pngUpload(overrides))
      .expect(201);
    const asset = await ctx.prisma.mediaAsset.findUniqueOrThrow({
      where: { id: response.body.data.asset.id },
    });
    return { body: response.body.data, asset };
  }

  beforeAll(async () => {
    storage = new InMemoryObjectStorage();
    ctx = await createTestApp({ storage });
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    storage.objects.clear();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe("upload authorization", () => {
    it("requires authentication", async () => {
      await ctx.http.post(`${API}/media/uploads`).send(pngUpload()).expect(401);
    });

    it("rejects formats outside the allow-list and invalid metadata", async () => {
      const rider = await registerUser(ctx.http);
      for (const invalid of [
        { mimeType: "image/svg+xml" },
        { mimeType: "text/html" },
        { fileSize: 0 },
        { fileSize: "12" },
        { category: "EVERYTHING" },
        { storageKey: "products/evil.png" },
      ]) {
        const response = await ctx.http
          .post(`${API}/media/uploads`)
          .set(bearer(rider.accessToken))
          .send(pngUpload(invalid))
          .expect(400);
        expect(response.body.error.code).toBe("VALIDATION_FAILED");
      }
      expect(await ctx.prisma.mediaAsset.count()).toBe(0);
    });

    it("rejects files above the size limit", async () => {
      const rider = await registerUser(ctx.http);
      const response = await ctx.http
        .post(`${API}/media/uploads`)
        .set(bearer(rider.accessToken))
        .send(pngUpload({ fileSize: 1024 * 1024 + 1 }))
        .expect(422);
      expect(response.body.error.code).toBe("MEDIA_TOO_LARGE");
    });

    it("limits riders to rider media while admins may upload any category", async () => {
      const rider = await registerUser(ctx.http);
      await ctx.http
        .post(`${API}/media/uploads`)
        .set(bearer(rider.accessToken))
        .send(pngUpload({ category: "PRODUCT" }))
        .expect(403);

      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const { asset } = await startUpload(admin.accessToken, { category: "PRODUCT" });
      expect(asset.storageKey).toMatch(/^products\//);
    });
  });

  describe("direct-to-storage flow", () => {
    it("creates a PENDING asset with a server-generated key and a pre-signed URL", async () => {
      const rider = await registerUser(ctx.http);
      const { body, asset } = await startUpload(rider.accessToken);

      expect(body.asset).toMatchObject({
        status: "PENDING",
        url: null,
        originalFileName: "avatar.png",
      });
      expect(body.upload).toMatchObject({
        method: "PUT",
        headers: { "Content-Type": "image/png" },
      });
      expect(body.upload.url).toContain(asset.storageKey);
      expect(asset.storageKey).toMatch(/^riders\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.png$/);
      expect(asset.storageKey).not.toContain("passwd");
      expect(asset.ownerId).toBe(rider.id);
      expect(storage.objects.size).toBe(0);
    });

    it("verifies the stored object and stores metadata only", async () => {
      const rider = await registerUser(ctx.http);
      const { asset } = await startUpload(rider.accessToken);

      const early = await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(422);
      expect(early.body.error.code).toBe("MEDIA_UPLOAD_MISSING");

      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");
      const response = await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: "READY",
        width: 4,
        height: 3,
        fileSize: TINY_PNG.length,
        url: `https://media.test/${asset.storageKey}`,
      });
      expect(response.body.data.uploadedAt).toEqual(expect.any(String));

      // Completing again is a no-op.
      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(200);

      const columns = await ctx.prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'media_assets'`;
      expect(columns.some((column) => column.data_type === "bytea")).toBe(false);
    });

    it("deletes uploads whose content is not the declared image type", async () => {
      const rider = await registerUser(ctx.http);
      const html = Buffer.from(
        "<html><script>alert(1)</script></html>".padEnd(TINY_PNG.length, " "),
      );
      const { asset } = await startUpload(rider.accessToken);
      storage.simulateUpload(asset.storageKey, html, "image/png");

      const response = await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(422);
      expect(response.body.error.code).toBe("MEDIA_UPLOAD_INVALID");
      expect(storage.objects.has(asset.storageKey)).toBe(false);
      expect(await ctx.prisma.mediaAsset.findUnique({ where: { id: asset.id } })).toBeNull();
    });

    it("deletes uploads whose size differs from the authorised size", async () => {
      const rider = await registerUser(ctx.http);
      const { asset } = await startUpload(rider.accessToken, { fileSize: TINY_PNG.length + 10 });
      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");

      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(422);
      expect(await ctx.prisma.mediaAsset.count()).toBe(0);
    });
  });

  describe("ownership", () => {
    it("hides assets from other riders but not from admins", async () => {
      const owner = await registerUser(ctx.http);
      const stranger = await registerUser(ctx.http);
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const { asset } = await startUpload(owner.accessToken);
      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");

      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(stranger.accessToken))
        .expect(404);
      await ctx.http.get(`${API}/media/${asset.id}`).set(bearer(stranger.accessToken)).expect(404);
      await ctx.http
        .delete(`${API}/media/${asset.id}`)
        .set(bearer(stranger.accessToken))
        .expect(404);

      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(admin.accessToken))
        .expect(200);
      await ctx.http.get(`${API}/media/${asset.id}`).set(bearer(admin.accessToken)).expect(200);
    });

    it("lists only the caller's READY assets, paginated", async () => {
      const rider = await registerUser(ctx.http);
      const other = await registerUser(ctx.http);
      for (let i = 0; i < 3; i += 1) {
        const { asset } = await startUpload(rider.accessToken);
        storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");
        await ctx.http
          .post(`${API}/media/${asset.id}/complete`)
          .set(bearer(rider.accessToken))
          .expect(200);
      }
      await startUpload(rider.accessToken); // still PENDING
      await startUpload(other.accessToken);

      const page = await ctx.http
        .get(`${API}/media`)
        .query({ limit: 2 })
        .set(bearer(rider.accessToken))
        .expect(200);
      expect(page.body.data).toHaveLength(2);
      expect(page.body.meta.nextCursor).toEqual(expect.any(String));

      const rest = await ctx.http
        .get(`${API}/media`)
        .query({ limit: 2, cursor: page.body.meta.nextCursor })
        .set(bearer(rider.accessToken))
        .expect(200);
      expect(rest.body.data).toHaveLength(1);
      expect(rest.body.meta.nextCursor).toBeNull();
    });

    it("updates alt text and deletes the record and stored object", async () => {
      const rider = await registerUser(ctx.http);
      const { asset } = await startUpload(rider.accessToken);
      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");
      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(200);

      const updated = await ctx.http
        .patch(`${API}/media/${asset.id}`)
        .set(bearer(rider.accessToken))
        .send({ altText: "  Riding past Chandratal  " })
        .expect(200);
      expect(updated.body.data.altText).toBe("Riding past Chandratal");

      await ctx.http.delete(`${API}/media/${asset.id}`).set(bearer(rider.accessToken)).expect(204);
      expect(storage.objects.has(asset.storageKey)).toBe(false);
      expect(await ctx.prisma.mediaAsset.count()).toBe(0);
    });
  });

  describe("rider avatar relationship", () => {
    it("attaches a READY rider asset and clears it when the asset is deleted", async () => {
      const rider = await registerUser(ctx.http);
      const { asset } = await startUpload(rider.accessToken);

      // PENDING assets cannot be attached.
      const pending = await ctx.http
        .patch(`${API}/riders/me`)
        .set(bearer(rider.accessToken))
        .send({ avatarMediaId: asset.id })
        .expect(422);
      expect(pending.body.error.code).toBe("MEDIA_NOT_USABLE");

      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");
      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(rider.accessToken))
        .expect(200);

      const profile = await ctx.http
        .patch(`${API}/riders/me`)
        .set(bearer(rider.accessToken))
        .send({ avatarMediaId: asset.id, city: "Pune", displayName: "Ghat Runner" })
        .expect(200);
      expect(profile.body.data).toMatchObject({
        city: "Pune",
        displayName: "Ghat Runner",
        avatar: {
          id: asset.id,
          width: 4,
          height: 3,
          url: `https://media.test/${asset.storageKey}`,
        },
      });

      await ctx.http.delete(`${API}/media/${asset.id}`).set(bearer(rider.accessToken)).expect(204);
      const after = await ctx.http
        .get(`${API}/riders/me`)
        .set(bearer(rider.accessToken))
        .expect(200);
      expect(after.body.data.avatar).toBeNull();
      expect(after.body.data.city).toBe("Pune");
    });

    it("refuses another rider's asset", async () => {
      const owner = await registerUser(ctx.http);
      const other = await registerUser(ctx.http);
      const { asset } = await startUpload(owner.accessToken);
      storage.simulateUpload(asset.storageKey, TINY_PNG, "image/png");
      await ctx.http
        .post(`${API}/media/${asset.id}/complete`)
        .set(bearer(owner.accessToken))
        .expect(200);

      await ctx.http
        .patch(`${API}/riders/me`)
        .set(bearer(other.accessToken))
        .send({ avatarMediaId: asset.id })
        .expect(422);
    });
  });
});

describe("Media without configured storage", () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("returns 503 instead of failing unpredictably", async () => {
    const rider = await registerUser(ctx.http);
    const response = await ctx.http
      .post(`${API}/media/uploads`)
      .set(bearer(rider.accessToken))
      .send({ fileName: "a.png", mimeType: "image/png", fileSize: 10, category: "RIDER" })
      .expect(503);
    expect(response.body.error.code).toBe("STORAGE_NOT_CONFIGURED");
  });
});
