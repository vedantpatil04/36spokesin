import { seedFoundersIfEmpty } from "../../src/community/founders.seed.js";
import { uploadImage } from "./helpers/catalog-fixtures.js";
import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { InMemoryObjectStorage } from "./helpers/in-memory-storage.js";
import { createDestination } from "./helpers/travel-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

type Founder = {
  id: string;
  name: string;
  role: string | null;
  shortBio: string | null;
  story: string | null;
  quote: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  image: { id: string; url: string | null } | null;
  sortOrder: number;
  status?: string;
};

describe("Community: founders, stories, rider spotlights and groups", () => {
  let ctx: TestContext;
  let storage: InMemoryObjectStorage;
  let admin: string;
  let rider: string;

  beforeAll(async () => {
    storage = new InMemoryObjectStorage();
    ctx = await createTestApp({ storage });
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    storage.objects.clear();
    storage.deleted.length = 0;
    admin = (await registerAdmin(ctx.http, ctx.prisma)).accessToken;
    rider = (await registerUser(ctx.http)).accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const post = (path: string, body: object, token = admin) =>
    ctx.http.post(`${API}${path}`).set(bearer(token)).send(body);
  const patch = (path: string, body: object, token = admin) =>
    ctx.http.patch(`${API}${path}`).set(bearer(token)).send(body);
  const publicGet = (path: string) => ctx.http.get(`${API}${path}`);

  describe("founders", () => {
    it("seeds the confirmed founders only into an empty table and never overwrites admin edits", async () => {
      expect(await seedFoundersIfEmpty(ctx.prisma)).toBe(2);

      const seeded = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(seeded.map((founder) => founder.name)).toContain("Simran Kathuria");
      // Nothing is invented: every optional field starts empty.
      for (const founder of seeded) {
        expect(founder).toMatchObject({
          role: null,
          shortBio: null,
          story: null,
          quote: null,
          instagramUrl: null,
          linkedinUrl: null,
          image: null,
        });
      }

      const [abhishek, simran] = seeded;
      await patch(`/admin/community/founders/${abhishek!.id}`, { role: "Set by admin" }).expect(
        200,
      );
      await post(`/admin/community/founders/${simran!.id}/archive`, {}).expect(200);
      await post("/admin/community/founders/reorder", { ids: [simran!.id, abhishek!.id] }).expect(
        200,
      );

      expect(await seedFoundersIfEmpty(ctx.prisma)).toBe(0);
      const rows = await ctx.prisma.founder.findMany({ orderBy: { sortOrder: "asc" } });
      expect(rows).toHaveLength(2);
      expect(rows.map((row) => [row.name, row.status, row.role])).toEqual([
        ["Simran Kathuria", "ARCHIVED", null],
        ["Abhishek Sharma", "PUBLISHED", "Set by admin"],
      ]);
    });

    it("lets an admin create, update, publish, archive and reorder; the public sees only published founders", async () => {
      const created = await post("/admin/community/founders", { name: "  First Founder " }).expect(
        201,
      );
      const first = created.body.data as Founder;
      expect(first).toMatchObject({
        name: "First Founder",
        status: "DRAFT",
        role: null,
        sortOrder: 0,
      });
      expect((await publicGet("/community/founders").expect(200)).body.data).toEqual([]);

      const updated = await patch(`/admin/community/founders/${first.id}`, {
        status: "PUBLISHED",
        role: "Co-founder",
        shortBio: "Short bio.",
        quote: "",
        instagramUrl: "https://www.instagram.com/example",
      }).expect(200);
      expect(updated.body.data).toMatchObject({
        status: "PUBLISHED",
        role: "Co-founder",
        quote: null,
      });

      const second = (
        await post("/admin/community/founders", {
          name: "Second Founder",
          status: "PUBLISHED",
        }).expect(201)
      ).body.data as Founder;
      expect(second.sortOrder).toBe(1);

      let publicList = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(publicList.map((founder) => founder.name)).toEqual([
        "First Founder",
        "Second Founder",
      ]);
      expect(publicList[0]).not.toHaveProperty("status");

      const reordered = await post("/admin/community/founders/reorder", {
        ids: [second.id],
      }).expect(200);
      expect((reordered.body.data as Founder[]).map((founder) => founder.id)).toEqual([
        second.id,
        first.id,
      ]);
      publicList = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(publicList.map((founder) => founder.name)).toEqual([
        "Second Founder",
        "First Founder",
      ]);

      await post(`/admin/community/founders/${first.id}/archive`, {}).expect(200);
      publicList = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(publicList.map((founder) => founder.name)).toEqual(["Second Founder"]);
      const archived = await ctx.http
        .get(`${API}/admin/community/founders?status=ARCHIVED`)
        .set(bearer(admin))
        .expect(200);
      expect(archived.body.data.map((founder: Founder) => founder.id)).toEqual([first.id]);

      const row = await ctx.prisma.founder.findUniqueOrThrow({ where: { id: first.id } });
      expect(row.createdById).not.toBeNull();
      expect(row.updatedById).toBe(row.createdById);
    });

    it("validates input and rejects unknown ids when reordering", async () => {
      await post("/admin/community/founders", {}).expect(400);
      const badLink = await post("/admin/community/founders", {
        name: "Founder",
        linkedinUrl: "not a link",
      }).expect(400);
      expect(badLink.body.error.details[0].field).toBe("linkedinUrl");
      const unknown = await post("/admin/community/founders/reorder", {
        ids: ["01a0c331-8e80-7abf-b106-44a4292a1309"],
      }).expect(422);
      expect(unknown.body.error.code).toBe("INVALID_REFERENCE");
      await patch("/admin/community/founders/01a0c331-8e80-7abf-b106-44a4292a1309", {
        name: "X Y",
      }).expect(404);
    });
  });

  describe("authorization", () => {
    const resources = ["founders", "stories", "riders", "groups"] as const;
    const someId = "01a0c331-8e80-7abf-b106-44a4292a1309";

    it("refuses every admin read and mutation to riders (403) and anonymous callers (401)", async () => {
      for (const resource of resources) {
        const base = `/admin/community/${resource}`;
        const body =
          resource === "stories" ? { title: "Rider attempt" } : { name: "Rider attempt" };
        await ctx.http.get(`${API}${base}`).set(bearer(rider)).expect(403);
        await post(base, body, rider).expect(403);
        await patch(`${base}/${someId}`, body, rider).expect(403);
        await post(`${base}/${someId}/archive`, {}, rider).expect(403);
        await post(`${base}/reorder`, { ids: [someId] }, rider).expect(403);
        await ctx.http.post(`${API}${base}`).send(body).expect(401);
      }
      expect(await ctx.prisma.founder.count()).toBe(0);
      expect(await ctx.prisma.story.count()).toBe(0);
      expect(await ctx.prisma.riderSpotlight.count()).toBe(0);
      expect(await ctx.prisma.communityGroup.count()).toBe(0);
    });

    it("serves the public endpoints without authentication", async () => {
      for (const path of ["founders", "stories", "riders", "groups"]) {
        await publicGet(`/community/${path}`).expect(200);
      }
    });
  });

  describe("stories", () => {
    it("runs the full lifecycle and only ever shows published stories", async () => {
      const draft = await post("/admin/community/stories", {
        title: "Spiti in Shoulder Season",
        excerpt: "Fewer riders, colder mornings.",
        content: Array.from({ length: 450 }, () => "word").join(" "),
        authorName: "A Rider",
      }).expect(201);
      const story = draft.body.data;
      expect(story).toMatchObject({
        slug: "spiti-in-shoulder-season",
        status: "DRAFT",
        publishedAt: null,
        readMinutes: 2,
      });
      await publicGet("/community/stories/spiti-in-shoulder-season").expect(404);
      expect((await publicGet("/community/stories").expect(200)).body.data).toEqual([]);

      const published = await patch(`/admin/community/stories/${story.id}`, {
        status: "PUBLISHED",
        featured: true,
      }).expect(200);
      expect(published.body.data.publishedAt).not.toBeNull();

      const detail = await publicGet("/community/stories/spiti-in-shoulder-season").expect(200);
      expect(detail.body.data).toMatchObject({
        title: "Spiti in Shoulder Season",
        authorName: "A Rider",
      });
      expect(detail.body.data.content).toContain("word");

      // A second story with the same title gets its own slug.
      const twin = await post("/admin/community/stories", {
        title: "Spiti in Shoulder Season",
        status: "PUBLISHED",
      }).expect(201);
      expect(twin.body.data.slug).toBe("spiti-in-shoulder-season-2");
      const taken = await patch(`/admin/community/stories/${twin.body.data.id}`, {
        slug: "spiti-in-shoulder-season",
      }).expect(409);
      expect(taken.body.error.code).toBe("SLUG_TAKEN");

      const featured = await publicGet("/community/stories?featured=true").expect(200);
      expect(featured.body.data.map((entry: { id: string }) => entry.id)).toEqual([story.id]);
      const all = await publicGet("/community/stories").expect(200);
      expect(all.body.data.map((entry: { id: string }) => entry.id)).toEqual([
        story.id,
        twin.body.data.id,
      ]);

      await post(`/admin/community/stories/${story.id}/archive`, {}).expect(200);
      await publicGet("/community/stories/spiti-in-shoulder-season").expect(404);
      // Re-publishing keeps the original publication date.
      const again = await patch(`/admin/community/stories/${story.id}`, {
        status: "PUBLISHED",
      }).expect(200);
      expect(again.body.data.publishedAt).toBe(published.body.data.publishedAt);
    });

    it("links a destination only while that destination is published", async () => {
      const destination = await createDestination(ctx.http, admin, { name: "Spiti Valley" });
      const created = await post("/admin/community/stories", {
        title: "Kaza by Night",
        status: "PUBLISHED",
        destinationId: destination.id,
      }).expect(201);
      expect(created.body.data.destinationId).toBe(destination.id);
      expect(created.body.data.destination).toBeNull();

      await patch(`/admin/destinations/${destination.id}`, { status: "PUBLISHED" }).expect(200);
      const detail = await publicGet("/community/stories/kaza-by-night").expect(200);
      expect(detail.body.data.destination).toMatchObject({
        slug: destination.slug,
        name: "Spiti Valley",
      });

      const missing = await post("/admin/community/stories", {
        title: "Nowhere",
        destinationId: "01a0c331-8e80-7abf-b106-44a4292a1309",
      }).expect(422);
      expect(missing.body.error.code).toBe("INVALID_REFERENCE");
    });
  });

  describe("rider spotlights", () => {
    it("runs the full lifecycle and only shows published spotlights", async () => {
      const created = await post("/admin/community/riders", {
        name: "Rider One",
        bike: "Himalayan 450",
        location: "Pune",
        favouriteRide: "Tamhini Ghat",
        shortStory: "Rides every Sunday.",
      }).expect(201);
      const spotlight = created.body.data;
      expect(spotlight).toMatchObject({ status: "DRAFT", bike: "Himalayan 450", image: null });
      expect((await publicGet("/community/riders").expect(200)).body.data).toEqual([]);

      await patch(`/admin/community/riders/${spotlight.id}`, {
        status: "PUBLISHED",
        location: "",
      }).expect(200);
      const second = await post("/admin/community/riders", {
        name: "Rider Two",
        status: "PUBLISHED",
      }).expect(201);
      let list = (await publicGet("/community/riders").expect(200)).body.data;
      expect(list.map((entry: { name: string }) => entry.name)).toEqual(["Rider One", "Rider Two"]);
      expect(list[0].location).toBeNull();

      await post("/admin/community/riders/reorder", {
        ids: [second.body.data.id, spotlight.id],
      }).expect(200);
      await post(`/admin/community/riders/${second.body.data.id}/archive`, {}).expect(200);
      list = (await publicGet("/community/riders").expect(200)).body.data;
      expect(list.map((entry: { name: string }) => entry.name)).toEqual(["Rider One"]);
    });
  });

  describe("groups", () => {
    it("runs the full lifecycle and keeps unknown member counts empty", async () => {
      const created = await post("/admin/community/groups", {
        name: "36 Spokes Pune",
        region: "Pune, Maharashtra",
        description: "Ghat runs before the traffic.",
      }).expect(201);
      const group = created.body.data;
      expect(group).toMatchObject({ slug: "36-spokes-pune", status: "DRAFT", memberCount: null });
      await publicGet("/community/groups/36-spokes-pune").expect(404);

      await patch(`/admin/community/groups/${group.id}`, {
        status: "PUBLISHED",
        rideCadence: "Sunday mornings",
      }).expect(200);
      const detail = await publicGet("/community/groups/36-spokes-pune").expect(200);
      expect(detail.body.data).toMatchObject({
        name: "36 Spokes Pune",
        rideCadence: "Sunday mornings",
        memberCount: null,
      });
      expect(detail.body.data).not.toHaveProperty("status");

      await patch(`/admin/community/groups/${group.id}`, { memberCount: -1 }).expect(400);
      await patch(`/admin/community/groups/${group.id}`, { memberCount: 12 }).expect(200);
      expect((await publicGet("/community/groups").expect(200)).body.data[0].memberCount).toBe(12);

      await post(`/admin/community/groups/${group.id}/archive`, {}).expect(200);
      expect((await publicGet("/community/groups").expect(200)).body.data).toEqual([]);
      await publicGet("/community/groups/36-spokes-pune").expect(404);
    });
  });

  describe("media", () => {
    it("attaches, replaces and removes a founder photo through the MediaAsset architecture", async () => {
      const founder = (
        await post("/admin/community/founders", { name: "Founder", status: "PUBLISHED" }).expect(
          201,
        )
      ).body.data as Founder;

      // Riders cannot upload community media; product images are the wrong kind.
      await post(
        "/media/uploads",
        { fileName: "me.png", mimeType: "image/png", fileSize: 73, category: "COMMUNITY" },
        rider,
      ).expect(403);
      const productImage = await uploadImage(ctx.http, storage, admin, "PRODUCT");
      const wrong = await patch(`/admin/community/founders/${founder.id}`, {
        imageMediaId: productImage.id,
      }).expect(422);
      expect(wrong.body.error.code).toBe("MEDIA_NOT_USABLE");

      const photo = await uploadImage(ctx.http, storage, admin, "COMMUNITY");
      await patch(`/admin/community/founders/${founder.id}`, { imageMediaId: photo.id }).expect(
        200,
      );
      const [served] = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(served!.image?.id).toBe(photo.id);
      expect(served!.image?.url).toContain(photo.storageKey);

      // Alt text lives on the asset and is edited through the media API.
      await patch(`/media/${photo.id}`, { altText: "Portrait of the founder" }).expect(200);
      const [described] = (await publicGet("/community/founders").expect(200)).body.data as {
        image: { altText: string | null };
      }[];
      expect(described!.image.altText).toBe("Portrait of the founder");

      // An image in use can't be deleted from the media library.
      const inUse = await ctx.http
        .delete(`${API}/admin/media/${photo.id}`)
        .set(bearer(admin))
        .expect(409);
      expect(inUse.body.error.code).toBe("MEDIA_IN_USE");

      // Replacing releases the old file; removing releases the new one.
      const replacement = await uploadImage(ctx.http, storage, admin, "COMMUNITY");
      await patch(`/admin/community/founders/${founder.id}`, {
        imageMediaId: replacement.id,
      }).expect(200);
      expect(storage.deleted).toContain(photo.storageKey);
      expect(await ctx.prisma.mediaAsset.count({ where: { id: photo.id } })).toBe(0);

      await patch(`/admin/community/founders/${founder.id}`, { imageMediaId: null }).expect(200);
      expect(storage.deleted).toContain(replacement.storageKey);
      const [cleared] = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(cleared!.image).toBeNull();
    });

    it("attaches story covers, spotlight photos and group covers of the right category", async () => {
      const cover = await uploadImage(ctx.http, storage, admin, "STORY");
      const story = await post("/admin/community/stories", {
        title: "With a cover",
        status: "PUBLISHED",
        coverMediaId: cover.id,
      }).expect(201);
      expect(story.body.data.cover.id).toBe(cover.id);

      const groupCover = await uploadImage(ctx.http, storage, admin, "GROUP");
      await post("/admin/community/groups", {
        name: "Group",
        status: "PUBLISHED",
        coverMediaId: cover.id,
      }).expect(422);
      const group = await post("/admin/community/groups", {
        name: "Group",
        status: "PUBLISHED",
        coverMediaId: groupCover.id,
      }).expect(201);
      expect(group.body.data.cover.id).toBe(groupCover.id);

      const portrait = await uploadImage(ctx.http, storage, admin, "COMMUNITY");
      const spotlight = await post("/admin/community/riders", {
        name: "Rider",
        status: "PUBLISHED",
        imageMediaId: portrait.id,
      }).expect(201);
      expect(spotlight.body.data.image.id).toBe(portrait.id);

      const usage = await ctx.http.get(`${API}/admin/media`).set(bearer(admin)).expect(200);
      const summaries = Object.fromEntries(
        usage.body.data.map((asset: { id: string; usage: { summary: string } }) => [
          asset.id,
          asset.usage.summary,
        ]),
      );
      expect(summaries[cover.id]).toBe("Used as 1 story cover image.");
      expect(summaries[groupCover.id]).toBe("Used as 1 group cover image.");
      expect(summaries[portrait.id]).toBe("Used as 1 rider spotlight photo.");
    });
  });

  describe("persistence", () => {
    it("keeps community content across an application restart", async () => {
      const founder = (
        await post("/admin/community/founders", {
          name: "Persistent Founder",
          status: "PUBLISHED",
        }).expect(201)
      ).body.data as Founder;
      await post("/admin/community/stories", {
        title: "Persistent Story",
        status: "PUBLISHED",
      }).expect(201);
      await post("/admin/community/riders", {
        name: "Persistent Rider",
        status: "PUBLISHED",
      }).expect(201);
      await post("/admin/community/groups", {
        name: "Persistent Group",
        status: "PUBLISHED",
      }).expect(201);

      await ctx.app.close();
      ctx = await createTestApp({ storage });

      const founders = (await publicGet("/community/founders").expect(200)).body.data as Founder[];
      expect(founders.map((entry) => entry.id)).toEqual([founder.id]);
      await publicGet("/community/stories/persistent-story").expect(200);
      expect((await publicGet("/community/riders").expect(200)).body.data).toHaveLength(1);
      await publicGet("/community/groups/persistent-group").expect(200);
    });
  });
});
