import { bearer, registerUser } from "./helpers/fixtures.js";
import { createBikeModel } from "./helpers/catalog-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("My Garage", () => {
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

  it("stores a rider's bikes on the server with exactly one primary", async () => {
    const rider = await registerUser(ctx.http);
    const himalayan = await createBikeModel(ctx.prisma, {
      variants: ["Kaza Brown", "Hanle Black"],
    });
    const ktm = await createBikeModel(ctx.prisma);

    await ctx.http.get(`${API}/my-bikes`).expect(401);

    const first = await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({
        bikeModelId: himalayan.id,
        bikeVariantId: himalayan.variants[0]!.id,
        odometerKm: 12_400,
        year: 2024,
      })
      .expect(201);
    expect(first.body.data).toMatchObject({
      isPrimary: true,
      bikeVariantName: "Kaza Brown",
      odometerKm: 12_400,
      bike: { id: himalayan.id },
    });

    const second = await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: ktm.id, nickname: "Weekend bike" })
      .expect(201);
    expect(second.body.data.isPrimary).toBe(false);

    await ctx.http
      .post(`${API}/my-bikes/${second.body.data.id}/primary`)
      .set(bearer(rider.accessToken))
      .expect(200);
    const list = await ctx.http.get(`${API}/my-bikes`).set(bearer(rider.accessToken)).expect(200);
    expect(
      list.body.data.map((bike: { id: string; isPrimary: boolean }) => [bike.id, bike.isPrimary]),
    ).toEqual([
      [second.body.data.id, true],
      [first.body.data.id, false],
    ]);

    const edited = await ctx.http
      .patch(`${API}/my-bikes/${first.body.data.id}`)
      .set(bearer(rider.accessToken))
      .send({ odometerKm: 13_000, bikeVariantId: himalayan.variants[1]!.id })
      .expect(200);
    expect(edited.body.data).toMatchObject({ odometerKm: 13_000, bikeVariantName: "Hanle Black" });

    // Removing the primary promotes the remaining bike.
    await ctx.http
      .delete(`${API}/my-bikes/${second.body.data.id}`)
      .set(bearer(rider.accessToken))
      .expect(204);
    const after = await ctx.http.get(`${API}/my-bikes`).set(bearer(rider.accessToken)).expect(200);
    expect(after.body.data).toEqual([
      expect.objectContaining({ id: first.body.data.id, isPrimary: true }),
    ]);
  });

  it("keeps garages private and choices valid", async () => {
    const rider = await registerUser(ctx.http);
    const other = await registerUser(ctx.http);
    const model = await createBikeModel(ctx.prisma);
    const otherModel = await createBikeModel(ctx.prisma);
    const archived = await createBikeModel(ctx.prisma, { archived: true });

    const bike = await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: model.id })
      .expect(201);
    await ctx.http
      .get(`${API}/my-bikes/${bike.body.data.id}`)
      .set(bearer(other.accessToken))
      .expect(404);
    await ctx.http
      .patch(`${API}/my-bikes/${bike.body.data.id}`)
      .set(bearer(other.accessToken))
      .send({ odometerKm: 1 })
      .expect(404);
    const otherList = await ctx.http
      .get(`${API}/my-bikes`)
      .set(bearer(other.accessToken))
      .expect(200);
    expect(otherList.body.data).toHaveLength(0);

    const archivedChoice = await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: archived.id })
      .expect(422);
    expect(archivedChoice.body.error.code).toBe("INVALID_REFERENCE");
    await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: model.id, bikeVariantId: otherModel.variants[0]!.id })
      .expect(422);
    await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: model.id, year: 1800 })
      .expect(400);

    // Archiving a model later does not remove it from a garage.
    await ctx.prisma.bikeModel.update({
      where: { id: model.id },
      data: { archivedAt: new Date() },
    });
    const kept = await ctx.http.get(`${API}/my-bikes`).set(bearer(rider.accessToken)).expect(200);
    expect(kept.body.data[0]).toMatchObject({ archived: true });
  });
});
