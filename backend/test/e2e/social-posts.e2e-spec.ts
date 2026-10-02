import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Social feed: public and admin endpoints", () => {
  let ctx: TestContext;
  let admin: string;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = (await registerAdmin(ctx.http, ctx.prisma)).accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("keeps all mutations admin-only and blocks non-admins (401 and 403)", async () => {
    const rider = await registerUser(ctx.http);

    // Unauthenticated
    await ctx.http.post(`${API}/admin/social-posts`).send({}).expect(401);
    await ctx.http.get(`${API}/admin/social-posts`).expect(401);

    // Rider (non-admin)
    await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(rider.accessToken))
      .send({ postUrl: "https://www.instagram.com/p/test/" })
      .expect(403);

    await ctx.http.get(`${API}/admin/social-posts`).set(bearer(rider.accessToken)).expect(403);

    await ctx.http
      .post(`${API}/admin/social-posts/reorder`)
      .set(bearer(rider.accessToken))
      .send({ postIds: [] })
      .expect(403);
  });

  it("creates, updates and archives social posts; drafts stay private", async () => {
    // 1. Admin creates a draft post (video type)
    const created = await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==",
        mediaType: "VIDEO",
        caption: "High mountain pass ride.",
        username: "36spokes",
        videoUrl: "https://storage.example.com/video.mp4",
      })
      .expect(201);

    expect(created.body.data).toMatchObject({
      postUrl: "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==",
      mediaType: "VIDEO",
      videoUrl: "https://storage.example.com/video.mp4",
      caption: "High mountain pass ride.",
      username: "36spokes",
      status: "DRAFT",
      platform: "INSTAGRAM",
      sortOrder: 0,
    });

    const postId = created.body.data.id;

    // Public feed does not show draft posts
    const publicList1 = await ctx.http.get(`${API}/social-posts`).expect(200);
    expect(publicList1.body.data).toHaveLength(0);

    // 2. Admin updates the post URL, caption, changes mediaType to IMAGE, and publishes it
    const updated = await ctx.http
      .patch(`${API}/admin/social-posts/${postId}`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/C_updated_url/",
        mediaType: "IMAGE",
        imageUrl: "https://images.example.com/photo.jpg",
        caption: "Updated mountain pass ride with Himalayan 450.",
        status: "PUBLISHED",
      })
      .expect(200);

    expect(updated.body.data).toMatchObject({
      postUrl: "https://www.instagram.com/p/C_updated_url/",
      mediaType: "IMAGE",
      imageUrl: "https://images.example.com/photo.jpg",
      caption: "Updated mountain pass ride with Himalayan 450.",
      status: "PUBLISHED",
    });

    // Public feed now shows the published post
    const publicList2 = await ctx.http.get(`${API}/social-posts`).expect(200);
    expect(publicList2.body.data).toHaveLength(1);
    expect(publicList2.body.data[0]).toMatchObject({
      id: postId,
      postUrl: "https://www.instagram.com/p/C_updated_url/",
      mediaType: "IMAGE",
      imageUrl: "https://images.example.com/photo.jpg",
      caption: "Updated mountain pass ride with Himalayan 450.",
      username: "36spokes",
      platform: "INSTAGRAM",
    });
    // Public response does not leak internal status
    expect(publicList2.body.data[0]).not.toHaveProperty("status");

    // 3. Admin archives the post via POST /admin/social-posts/:id/archive
    await ctx.http
      .post(`${API}/admin/social-posts/${postId}/archive`)
      .set(bearer(admin))
      .expect(200);

    // Public feed hides archived post
    const publicList3 = await ctx.http.get(`${API}/social-posts`).expect(200);
    expect(publicList3.body.data).toHaveLength(0);

    // Admin list still contains archived post
    const adminList = await ctx.http
      .get(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .expect(200);
    expect(adminList.body.data).toHaveLength(1);
    expect(adminList.body.data[0].status).toBe("ARCHIVED");
  });

  it("reorders posts and reflects the updated order on the public API", async () => {
    // Create 3 published posts
    const post1 = await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/post1/",
        status: "PUBLISHED",
        caption: "First post",
      })
      .expect(201);

    const post2 = await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/post2/",
        status: "PUBLISHED",
        caption: "Second post",
      })
      .expect(201);

    const post3 = await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/post3/",
        status: "PUBLISHED",
        caption: "Third post",
      })
      .expect(201);

    const id1 = post1.body.data.id;
    const id2 = post2.body.data.id;
    const id3 = post3.body.data.id;

    // Check initial order: 1, 2, 3
    const initialList = await ctx.http.get(`${API}/social-posts`).expect(200);
    expect(initialList.body.data.map((p: { id: string }) => p.id)).toEqual([id1, id2, id3]);

    // Reorder: 3, 1, 2
    await ctx.http
      .post(`${API}/admin/social-posts/reorder`)
      .set(bearer(admin))
      .send({ postIds: [id3, id1, id2] })
      .expect(200);

    // Check reordered public feed
    const reorderedList = await ctx.http.get(`${API}/social-posts`).expect(200);
    expect(reorderedList.body.data.map((p: { id: string }) => p.id)).toEqual([id3, id1, id2]);
  });

  it("rejects invalid URLs for postUrl, imageUrl, and videoUrl", async () => {
    // Invalid postUrl
    await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "not-a-valid-url",
      })
      .expect(400);

    // Invalid imageUrl
    await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/valid/",
        imageUrl: "not-a-valid-image-url",
      })
      .expect(400);

    // Invalid videoUrl
    await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/valid/",
        videoUrl: "not-a-valid-video-url",
      })
      .expect(400);
  });

  it("validates mediaAssetId exists and is ready", async () => {
    // Non-existent UUID
    await ctx.http
      .post(`${API}/admin/social-posts`)
      .set(bearer(admin))
      .send({
        postUrl: "https://www.instagram.com/p/valid/",
        mediaAssetId: "01940000-0000-7000-8000-000000000001",
      })
      .expect(400);
  });
});
