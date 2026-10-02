import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { createDestination } from "./helpers/travel-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Travel: destinations and trips", () => {
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

  it("keeps every travel mutation admin-only", async () => {
    const rider = await registerUser(ctx.http);
    await ctx.http.post(`${API}/admin/destinations`).send({}).expect(401);
    for (const path of ["/admin/destinations", "/admin/trips", "/admin/rides"]) {
      await ctx.http.post(`${API}${path}`).set(bearer(rider.accessToken)).send({}).expect(403);
      await ctx.http.get(`${API}${path}`).set(bearer(rider.accessToken)).expect(403);
    }
  });

  it("creates, updates and publishes a destination; drafts stay private", async () => {
    const created = await ctx.http
      .post(`${API}/admin/destinations`)
      .set(bearer(admin))
      .send({
        name: "Spiti Valley",
        region: "Himachal Pradesh",
        difficulty: "CHALLENGING",
        bestSeason: "June to September",
        durationRecommendation: "8–12 days",
        usefulInfo: "Inner Line Permit needed beyond Kaza.",
      })
      .expect(201);
    expect(created.body.data).toMatchObject({
      slug: "spiti-valley",
      status: "DRAFT",
      country: "India",
      publishedAt: null,
    });

    await ctx.http.get(`${API}/destinations/spiti-valley`).expect(404);
    expect((await ctx.http.get(`${API}/destinations`).expect(200)).body.data).toHaveLength(0);

    const published = await ctx.http
      .patch(`${API}/admin/destinations/${created.body.data.id}`)
      .set(bearer(admin))
      .send({
        status: "PUBLISHED",
        shortDescription: "High desert, higher passes.",
        bestSeason: null,
      })
      .expect(200);
    expect(published.body.data).toMatchObject({ status: "PUBLISHED", bestSeason: null });
    expect(published.body.data.publishedAt).toEqual(expect.any(String));

    const detail = await ctx.http.get(`${API}/destinations/spiti-valley`).expect(200);
    expect(detail.body.data).toMatchObject({
      name: "Spiti Valley",
      shortDescription: "High desert, higher passes.",
      usefulInfo: "Inner Line Permit needed beyond Kaza.",
      images: [],
      primaryImage: null,
      startingPrice: null,
    });
    expect(detail.body.data).not.toHaveProperty("status");

    await ctx.http
      .delete(`${API}/admin/destinations/${created.body.data.id}`)
      .set(bearer(admin))
      .expect(200);
    await ctx.http.get(`${API}/destinations/spiti-valley`).expect(404);
  });

  it("persists trips with itinerary and departures and shows only published ones", async () => {
    const destination = await createDestination(ctx.http, admin, {
      status: "PUBLISHED",
      name: "Spiti Valley",
    });
    const future = (days: number) =>
      new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

    const trip = await ctx.http
      .post(`${API}/admin/trips`)
      .set(bearer(admin))
      .send({
        name: "Spiti Circuit",
        destinationId: destination.id,
        durationDays: 9,
        distanceKm: 1850,
        difficulty: "CHALLENGING",
        startingLocation: "Manali",
        endingLocation: "Shimla",
        itinerary: [
          { title: "Arrive in Manali", accommodation: "Riverside hotel" },
          {
            title: "Manali to Kaza via Kunzum La",
            distanceKm: 200,
            routeSummary: "Atal Tunnel, Batal, Kunzum",
          },
        ],
        departures: [
          { startDate: future(40), endDate: future(48), price: 6_450_000, capacity: 12 },
          { startDate: future(10), endDate: future(18), price: 5_950_000, capacity: 12 },
        ],
      })
      .expect(201);
    expect(trip.body.data.itinerary.map((day: { dayNumber: number }) => day.dayNumber)).toEqual([
      1, 2,
    ]);
    expect(trip.body.data.departures[0].startDate).toBe(future(10));

    await ctx.http.get(`${API}/trips/spiti-circuit`).expect(404);

    const keep = trip.body.data.departures[0];
    const updated = await ctx.http
      .patch(`${API}/admin/trips/${trip.body.data.id}`)
      .set(bearer(admin))
      .send({
        status: "PUBLISHED",
        itinerary: [{ title: "Manali" }, { title: "Kaza" }, { title: "Chandratal" }],
        departures: [
          {
            id: keep.id,
            startDate: keep.startDate,
            endDate: keep.endDate,
            price: 5_500_000,
            capacity: 10,
          },
        ],
      })
      .expect(200);
    expect(updated.body.data.itinerary.map((day: { title: string }) => day.title)).toEqual([
      "Manali",
      "Kaza",
      "Chandratal",
    ]);
    expect(updated.body.data.departures).toEqual([
      expect.objectContaining({ id: keep.id, price: 5_500_000, capacity: 10 }),
    ]);

    const bad = await ctx.http
      .patch(`${API}/admin/trips/${trip.body.data.id}`)
      .set(bearer(admin))
      .send({ departures: [{ startDate: future(20), endDate: future(10), capacity: 5 }] })
      .expect(400);
    expect(bad.body.error.details[0].field).toBe("departures.0.endDate");

    const publicTrip = await ctx.http.get(`${API}/trips/spiti-circuit`).expect(200);
    expect(publicTrip.body.data).toMatchObject({
      destination: { slug: "spiti-valley" },
      durationDays: 9,
    });
    expect(publicTrip.body.data.itinerary).toHaveLength(3);

    const list = await ctx.http
      .get(`${API}/trips`)
      .query({ destination: "spiti-valley" })
      .expect(200);
    expect(list.body.data).toHaveLength(1);
    const destinationDetail = await ctx.http.get(`${API}/destinations/spiti-valley`).expect(200);
    expect(destinationDetail.body.data).toMatchObject({ tripCount: 1, startingPrice: 5_500_000 });

    // A trip under an unpublished destination is not public.
    await ctx.http
      .patch(`${API}/admin/destinations/${destination.id}`)
      .set(bearer(admin))
      .send({ status: "DRAFT" })
      .expect(200);
    await ctx.http.get(`${API}/trips/spiti-circuit`).expect(404);
  });
});
