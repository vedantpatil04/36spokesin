import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { createCategory, createProduct, uploadImage } from "./helpers/catalog-fixtures.js";
import { InMemoryObjectStorage } from "./helpers/in-memory-storage.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

type Image = {
  id: string;
  mediaAssetId: string;
  sortOrder: number;
  isPrimary: boolean;
  altText: string | null;
};

describe("Product images", () => {
  let ctx: TestContext;
  let storage: InMemoryObjectStorage;
  let adminToken: string;
  let productId: string;
  let productSlug: string;

  const images = (productIdOverride = productId) =>
    ctx.http
      .get(`${API}/admin/products/${productIdOverride}/images`)
      .set(bearer(adminToken))
      .expect(200);

  async function attach(assetId: string, body: Record<string, unknown> = {}, id = productId) {
    const response = await ctx.http
      .post(`${API}/admin/products/${id}/images`)
      .set(bearer(adminToken))
      .send({ mediaAssetId: assetId, ...body })
      .expect(201);
    return response.body.data.images as Image[];
  }

  beforeAll(async () => {
    storage = new InMemoryObjectStorage();
    ctx = await createTestApp({ storage });
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    storage.objects.clear();
    storage.deleted.length = 0;
    const admin = await registerAdmin(ctx.http, ctx.prisma);
    adminToken = admin.accessToken;
    const category = await createCategory(ctx.prisma);
    const product = await createProduct(ctx.http, adminToken, {
      categoryId: category.id,
      name: "Riding Jacket",
      status: "PUBLISHED",
    });
    productId = product.id;
    productSlug = product.slug;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("only lets admins upload product media", async () => {
    const rider = await registerUser(ctx.http);
    const response = await ctx.http
      .post(`${API}/media/uploads`)
      .set(bearer(rider.accessToken))
      .send({ fileName: "a.png", mimeType: "image/png", fileSize: 10, category: "PRODUCT" })
      .expect(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("attaches, orders, re-primaries and edits a gallery the storefront renders as returned", async () => {
    const hero = await uploadImage(ctx.http, storage, adminToken);
    const front = await uploadImage(ctx.http, storage, adminToken);
    const rear = await uploadImage(ctx.http, storage, adminToken);

    let gallery = await attach(hero.id);
    expect(gallery[0]).toMatchObject({ isPrimary: true, sortOrder: 0 });
    gallery = await attach(front.id, { altText: "Front view" });
    gallery = await attach(rear.id, { isPrimary: true });
    expect(gallery.filter((image) => image.isPrimary).map((image) => image.mediaAssetId)).toEqual([
      rear.id,
    ]);

    // Unfinished uploads and duplicates are refused.
    const pending = await ctx.http
      .post(`${API}/media/uploads`)
      .set(bearer(adminToken))
      .send({ fileName: "p.png", mimeType: "image/png", fileSize: 73, category: "PRODUCT" })
      .expect(201);
    const notReady = await ctx.http
      .post(`${API}/admin/products/${productId}/images`)
      .set(bearer(adminToken))
      .send({ mediaAssetId: pending.body.data.asset.id })
      .expect(422);
    expect(notReady.body.error.code).toBe("MEDIA_NOT_USABLE");
    await ctx.http
      .post(`${API}/admin/products/${productId}/images`)
      .set(bearer(adminToken))
      .send({ mediaAssetId: hero.id })
      .expect(409);

    const [heroImage, frontImage, rearImage] = gallery;
    const reordered = await ctx.http
      .post(`${API}/admin/products/${productId}/images/reorder`)
      .set(bearer(adminToken))
      .send({ imageIds: [rearImage!.id, heroImage!.id, frontImage!.id] })
      .expect(200);
    expect(reordered.body.data.images.map((image: Image) => [image.id, image.sortOrder])).toEqual([
      [rearImage!.id, 0],
      [heroImage!.id, 1],
      [frontImage!.id, 2],
    ]);
    await ctx.http
      .post(`${API}/admin/products/${productId}/images/reorder`)
      .set(bearer(adminToken))
      .send({ imageIds: [rearImage!.id, heroImage!.id] })
      .expect(400);

    await ctx.http
      .post(`${API}/admin/products/${productId}/images/${frontImage!.id}/primary`)
      .set(bearer(adminToken))
      .expect(200);
    await ctx.http
      .patch(`${API}/admin/products/${productId}/images/${frontImage!.id}`)
      .set(bearer(adminToken))
      .send({ altText: "Riding jacket, front view" })
      .expect(200);

    const primaries = await ctx.prisma.productImage.count({
      where: { productId, isPrimary: true },
    });
    expect(primaries).toBe(1);

    const storefront = await ctx.http.get(`${API}/products/${productSlug}`).expect(200);
    expect(storefront.body.data.primaryImage).toMatchObject({
      mediaAssetId: front.id,
      altText: "Riding jacket, front view",
      url: `https://media.test/${front.storageKey}`,
    });
    expect(storefront.body.data.images.map((image: Image) => image.mediaAssetId)).toEqual([
      rear.id,
      hero.id,
      front.id,
    ]);
    const card = await ctx.http.get(`${API}/products`).expect(200);
    expect(card.body.data[0].primaryImage.mediaAssetId).toBe(front.id);
  });

  it("replaces an image in place and deletes the old file only when nothing else uses it", async () => {
    const original = await uploadImage(ctx.http, storage, adminToken);
    const replacement = await uploadImage(ctx.http, storage, adminToken);
    const [image] = await attach(original.id, { altText: "Old photo" });

    const replaced = await ctx.http
      .post(`${API}/admin/products/${productId}/images/${image!.id}/replace`)
      .set(bearer(adminToken))
      .send({ mediaAssetId: replacement.id })
      .expect(200);
    expect(replaced.body.data.images[0]).toMatchObject({
      id: image!.id,
      mediaAssetId: replacement.id,
      isPrimary: true,
      sortOrder: 0,
      altText: null,
    });
    expect(storage.deleted).toEqual([original.storageKey]);
    expect(await ctx.prisma.mediaAsset.count({ where: { id: original.id } })).toBe(0);
  });

  it("keeps files shared by a duplicated product until the last reference is removed", async () => {
    const asset = await uploadImage(ctx.http, storage, adminToken);
    await attach(asset.id);
    const copy = await ctx.http
      .post(`${API}/admin/products/${productId}/duplicate`)
      .set(bearer(adminToken))
      .expect(201);
    expect(copy.body.data.images[0].mediaAssetId).toBe(asset.id);

    // The asset is in use: the generic delete endpoint refuses, and so does the library.
    const blocked = await ctx.http
      .delete(`${API}/media/${asset.id}`)
      .set(bearer(adminToken))
      .expect(409);
    expect(blocked.body.error.code).toBe("MEDIA_IN_USE");
    expect(blocked.body.error.message).toContain("2 product images");
    await ctx.http.delete(`${API}/admin/media/${asset.id}`).set(bearer(adminToken)).expect(409);

    const library = await ctx.http.get(`${API}/admin/media`).set(bearer(adminToken)).expect(200);
    expect(library.body.data[0].usage).toMatchObject({ total: 2 });

    const originalImage = (await images()).body.data.images[0] as Image;
    await ctx.http
      .delete(`${API}/admin/products/${productId}/images/${originalImage.id}`)
      .set(bearer(adminToken))
      .expect(200);
    expect(storage.objects.has(asset.storageKey)).toBe(true);

    const copyImage = copy.body.data.images[0] as Image;
    await ctx.http
      .delete(`${API}/admin/products/${copy.body.data.id}/images/${copyImage.id}`)
      .set(bearer(adminToken))
      .expect(200);
    expect(storage.objects.has(asset.storageKey)).toBe(false);
    expect(await ctx.prisma.mediaAsset.count({ where: { id: asset.id } })).toBe(0);
  });

  it("promotes the next image when the primary is removed and keeps ordering contiguous", async () => {
    const assets = [
      await uploadImage(ctx.http, storage, adminToken),
      await uploadImage(ctx.http, storage, adminToken),
      await uploadImage(ctx.http, storage, adminToken),
    ];
    let gallery: Image[] = [];
    for (const asset of assets) gallery = await attach(asset.id);

    const removed = await ctx.http
      .delete(`${API}/admin/products/${productId}/images/${gallery[0]!.id}`)
      .set(bearer(adminToken))
      .expect(200);
    expect(
      removed.body.data.images.map((image: Image) => [image.sortOrder, image.isPrimary]),
    ).toEqual([
      [0, true],
      [1, false],
    ]);
  });

  it("lists unused catalogue media for cleanup and deletes it", async () => {
    const orphan = await uploadImage(ctx.http, storage, adminToken);
    const used = await uploadImage(ctx.http, storage, adminToken);
    await attach(used.id);

    const unused = await ctx.http
      .get(`${API}/admin/media`)
      .query({ unused: "true" })
      .set(bearer(adminToken))
      .expect(200);
    expect(unused.body.data.map((asset: { id: string }) => asset.id)).toEqual([orphan.id]);

    await ctx.http.delete(`${API}/admin/media/${orphan.id}`).set(bearer(adminToken)).expect(204);
    expect(storage.objects.has(orphan.storageKey)).toBe(false);
  });

  it("serialises concurrent primary changes so exactly one primary remains", async () => {
    const assets = await Promise.all(
      [1, 2, 3, 4].map(() => uploadImage(ctx.http, storage, adminToken)),
    );
    let gallery: Image[] = [];
    for (const asset of assets) gallery = await attach(asset.id);

    await Promise.all(
      gallery.map((image) =>
        ctx.http
          .post(`${API}/admin/products/${productId}/images/${image.id}/primary`)
          .set(bearer(adminToken))
          .expect(200),
      ),
    );
    expect(await ctx.prisma.productImage.count({ where: { productId, isPrimary: true } })).toBe(1);
  });
});
