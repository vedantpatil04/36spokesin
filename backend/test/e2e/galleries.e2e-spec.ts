import { bearer, registerAdmin } from "./helpers/fixtures.js";
import { uploadImage } from "./helpers/catalog-fixtures.js";
import { InMemoryObjectStorage } from "./helpers/in-memory-storage.js";
import { createDestination, createRide } from "./helpers/travel-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

type Image = { id: string; mediaAssetId: string; sortOrder: number; isPrimary: boolean };

describe("Destination, trip and ride galleries", () => {
  let ctx: TestContext;
  let storage: InMemoryObjectStorage;
  let admin: string;

  beforeAll(async () => {
    storage = new InMemoryObjectStorage();
    ctx = await createTestApp({ storage });
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    storage.objects.clear();
    storage.deleted.length = 0;
    admin = (await registerAdmin(ctx.http, ctx.prisma)).accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const attach = async (path: string, mediaAssetId: string) =>
    (await ctx.http.post(`${API}${path}`).set(bearer(admin)).send({ mediaAssetId }).expect(201))
      .body.data.images as Image[];

  it("manages a destination gallery end to end and serves it publicly", async () => {
    const destination = await createDestination(ctx.http, admin, { status: "PUBLISHED" });
    const base = `/admin/destinations/${destination.id}/images`;
    const assets = [];
    for (let i = 0; i < 3; i += 1)
      assets.push(await uploadImage(ctx.http, storage, admin, "DESTINATION"));

    let gallery: Image[] = [];
    for (const asset of assets) gallery = await attach(base, asset.id);
    expect(gallery.map((image) => [image.sortOrder, image.isPrimary])).toEqual([
      [0, true],
      [1, false],
      [2, false],
    ]);

    // Only DESTINATION images belong in a destination gallery.
    const productImage = await uploadImage(ctx.http, storage, admin, "PRODUCT");
    const wrong = await ctx.http
      .post(`${API}${base}`)
      .set(bearer(admin))
      .send({ mediaAssetId: productImage.id })
      .expect(422);
    expect(wrong.body.error.code).toBe("MEDIA_NOT_USABLE");

    const [first, second, third] = gallery;
    await ctx.http
      .post(`${API}${base}/reorder`)
      .set(bearer(admin))
      .send({ imageIds: [third!.id, first!.id, second!.id] })
      .expect(200);
    await ctx.http.post(`${API}${base}/${second!.id}/primary`).set(bearer(admin)).expect(200);
    await ctx.http
      .patch(`${API}${base}/${second!.id}`)
      .set(bearer(admin))
      .send({ altText: "Key Monastery" })
      .expect(200);

    const publicDetail = await ctx.http.get(`${API}/destinations/${destination.slug}`).expect(200);
    expect(publicDetail.body.data.primaryImage).toMatchObject({
      id: second!.id,
      altText: "Key Monastery",
    });
    expect(publicDetail.body.data.images.map((image: Image) => image.id)).toEqual([
      third!.id,
      first!.id,
      second!.id,
    ]);

    // Replace keeps the slot; the old file goes from storage.
    const fresh = await uploadImage(ctx.http, storage, admin, "DESTINATION");
    await ctx.http
      .post(`${API}${base}/${first!.id}/replace`)
      .set(bearer(admin))
      .send({ mediaAssetId: fresh.id })
      .expect(200);
    expect(storage.deleted).toContain(assets[0]!.storageKey);

    // In-use files can't be deleted directly; removing the image releases them.
    const blocked = await ctx.http
      .delete(`${API}/media/${assets[1]!.id}`)
      .set(bearer(admin))
      .expect(409);
    expect(blocked.body.error.code).toBe("MEDIA_IN_USE");
    const after = await ctx.http
      .delete(`${API}${base}/${second!.id}`)
      .set(bearer(admin))
      .expect(200);
    expect(after.body.data.images.filter((image: Image) => image.isPrimary)).toHaveLength(1);
    expect(storage.objects.has(assets[1]!.storageKey)).toBe(false);
  });

  it("gives trips and rides the same gallery, each keeping its own primary", async () => {
    const destination = await createDestination(ctx.http, admin);
    const trip = await ctx.http
      .post(`${API}/admin/trips`)
      .set(bearer(admin))
      .send({
        name: "Spiti Circuit",
        destinationId: destination.id,
        durationDays: 9,
        difficulty: "CHALLENGING",
        startingLocation: "Manali",
      })
      .expect(201);
    const ride = await createRide(ctx.http, admin);

    const tripImage = await uploadImage(ctx.http, storage, admin, "TRIP");
    const rideImages = [
      await uploadImage(ctx.http, storage, admin, "RIDE"),
      await uploadImage(ctx.http, storage, admin, "RIDE"),
    ];
    const tripGallery = await attach(`/admin/trips/${trip.body.data.id}/images`, tripImage.id);
    let rideGallery: Image[] = [];
    for (const asset of rideImages)
      rideGallery = await attach(`/admin/rides/${ride.id}/images`, asset.id);

    expect(tripGallery[0]!.isPrimary).toBe(true);
    expect(rideGallery.filter((image) => image.isPrimary)).toHaveLength(1);
    const publicRide = await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200);
    expect(publicRide.body.data.images).toHaveLength(2);
    expect(await ctx.prisma.galleryImage.count()).toBe(3);

    // An image id from another gallery is not found here.
    await ctx.http
      .post(`${API}/admin/rides/${ride.id}/images/${tripGallery[0]!.id}/primary`)
      .set(bearer(admin))
      .expect(404);
  });
});
