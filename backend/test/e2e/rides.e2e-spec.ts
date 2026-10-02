import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { createBikeModel } from "./helpers/catalog-fixtures.js";
import { createRide } from "./helpers/travel-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

/** The least a rider sends to book: a number the crew can reach them on. */
const BOOKING = { contactPhone: "+919876543210" };

describe("Rides and ride registration", () => {
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

  it("manages rides in the CMS and shows only public statuses", async () => {
    const draft = await createRide(ctx.http, admin, { status: "DRAFT", title: "Tamhini sunrise" });
    await ctx.http.get(`${API}/rides/${draft.slug}`).expect(404);
    expect((await ctx.http.get(`${API}/rides`).expect(200)).body.data).toHaveLength(0);

    const updated = await ctx.http
      .patch(`${API}/admin/rides/${draft.id}`)
      .set(bearer(admin))
      .send({ status: "UPCOMING", capacity: 12, price: 99900, waypoints: [" Paud ", "Tamhini"] })
      .expect(200);
    expect(updated.body.data).toMatchObject({
      status: "UPCOMING",
      capacity: 12,
      price: 99900,
      waypoints: ["Paud", "Tamhini"],
    });

    const listed = await ctx.http.get(`${API}/rides`).expect(200);
    expect(listed.body.data[0]).toMatchObject({
      slug: "tamhini-sunrise",
      spotsLeft: 12,
      price: 99900,
      registrationOpen: true,
    });

    // Price is optional: rides are free until one is set, and null clears it.
    const free = await createRide(ctx.http, admin, { title: "Free loop" });
    expect(
      (await ctx.http.get(`${API}/rides/${free.slug}`).expect(200)).body.data.price,
    ).toBeNull();
    const cleared = await ctx.http
      .patch(`${API}/admin/rides/${draft.id}`)
      .set(bearer(admin))
      .send({ price: null })
      .expect(200);
    expect(cleared.body.data.price).toBeNull();
    await ctx.http
      .patch(`${API}/admin/rides/${draft.id}`)
      .set(bearer(admin))
      .send({ price: -1 })
      .expect(400);

    await ctx.http.delete(`${API}/admin/rides/${draft.id}`).set(bearer(admin)).expect(200);
    await ctx.http.get(`${API}/rides/tamhini-sunrise`).expect(404);
  });

  it("lets riders join and leave, without duplicates", async () => {
    const ride = await createRide(ctx.http, admin);
    const rider = await registerUser(ctx.http);

    await ctx.http.post(`${API}/rides/${ride.id}/join`).expect(401);
    const joined = await ctx.http
      .post(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .send(BOOKING)
      .expect(201);
    expect(joined.body.data).toMatchObject({ registered: true, status: "REGISTERED" });

    const duplicate = await ctx.http
      .post(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .send(BOOKING)
      .expect(409);
    expect(duplicate.body.error.code).toBe("ALREADY_REGISTERED");
    expect(await ctx.prisma.rideRegistration.count()).toBe(1);

    const status = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(status.body.data.registered).toBe(true);
    const mine = await ctx.http.get(`${API}/my-rides`).set(bearer(rider.accessToken)).expect(200);
    expect(mine.body.data[0].ride).toMatchObject({ id: ride.id, registeredCount: 1, spotsLeft: 9 });

    const left = await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(left.body.data).toMatchObject({ registered: false, status: "CANCELLED" });
    // The booking is kept as history, its seat is free again, and it can't be cancelled twice.
    const twice = await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .expect(409);
    expect(twice.body.error.code).toBe("CONFLICT");
    expect(await ctx.prisma.rideRegistration.count({ where: { status: "CANCELLED" } })).toBe(1);
    const history = await ctx.http
      .get(`${API}/my-rides`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0]).toMatchObject({
      status: "CANCELLED",
      cancelledAt: expect.any(String),
      ride: { id: ride.id, registeredCount: 0, spotsLeft: 10 },
    });
    // Someone with no booking has nothing to cancel.
    const stranger = await registerUser(ctx.http);
    await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(stranger.accessToken))
      .expect(404);

    // Re-joining reuses the row.
    await ctx.http
      .post(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .send(BOOKING)
      .expect(201);
    expect(await ctx.prisma.rideRegistration.count()).toBe(1);

    const admins = await ctx.http
      .get(`${API}/admin/rides/${ride.id}`)
      .set(bearer(admin))
      .expect(200);
    expect(admins.body.data.registeredCount).toBe(1);
    const shrink = await ctx.http
      .patch(`${API}/admin/rides/${ride.id}`)
      .set(bearer(admin))
      .send({ capacity: 0 })
      .expect(400);
    expect(shrink.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("stores a booking with the rider's details and the price quoted", async () => {
    // A paid ride is held until its payment is verified (see payments.e2e-spec.ts).
    await ctx.http
      .patch(`${API}/admin/payment-settings`)
      .set(bearer(admin))
      .send({ upiId: "crew@okaxis" })
      .expect(200);
    const ride = await createRide(ctx.http, admin, { price: 99900 });
    const rider = await registerUser(ctx.http);
    const other = await registerUser(ctx.http);
    const model = await createBikeModel(ctx.prisma, { variants: ["Rally"] });
    const bike = await ctx.http
      .post(`${API}/my-bikes`)
      .set(bearer(rider.accessToken))
      .send({ bikeModelId: model.id, bikeVariantId: model.variants[0]!.id, year: 2024 })
      .expect(201);
    const book = (token: string, body: Record<string, unknown>) =>
      ctx.http.post(`${API}/rides/${ride.id}/join`).set(bearer(token)).send(body);

    // A reachable phone number is required.
    const missing = await book(rider.accessToken, {}).expect(400);
    expect(missing.body.error.details[0].field).toBe("contactPhone");
    await book(rider.accessToken, { contactPhone: "12" }).expect(400);
    // Only the rider's own motorcycle can go on the booking.
    const foreign = await book(other.accessToken, {
      ...BOOKING,
      riderBikeId: bike.body.data.id,
    }).expect(422);
    expect(foreign.body.error.code).toBe("INVALID_REFERENCE");
    expect(await ctx.prisma.rideRegistration.count()).toBe(0);

    const booked = await book(rider.accessToken, {
      contactPhone: "+91 98765-43210",
      riderBikeId: bike.body.data.id,
      note: "  Veg lunch  ",
    }).expect(201);
    expect(booked.body.data).toMatchObject({
      registered: false,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      number: expect.any(Number),
      contactPhone: "+919876543210",
      bikeLabel: expect.stringMatching(/^Brand \d+ Model \d+ Rally \(2024\)$/),
      note: "Veg lunch",
      amount: 99900,
      currency: "INR",
    });
    const number = booked.body.data.number as number;
    expect(
      await ctx.prisma.rideRegistration.findUniqueOrThrow({ where: { number } }),
    ).toMatchObject({
      rideId: ride.id,
      userId: rider.id,
      status: "PENDING_PAYMENT",
      amount: 99900,
    });

    // The booking reads back the same later, and is listed under the rider's rides.
    const read = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(read.body.data).toMatchObject({ number, contactPhone: "+919876543210", amount: 99900 });
    const mine = await ctx.http.get(`${API}/my-rides`).set(bearer(rider.accessToken)).expect(200);
    expect(mine.body.data[0]).toMatchObject({
      bookingNumber: number,
      reference: `36S-${String(number).padStart(6, "0")}`,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      cancelledAt: null,
      ride: { id: ride.id },
    });
    expect(read.body.data.reference).toBe(mine.body.data[0].reference);

    // The crew sees who is booked; riders can't read that list.
    await ctx.http
      .get(`${API}/admin/rides/${ride.id}/bookings`)
      .set(bearer(rider.accessToken))
      .expect(403);
    const crew = await ctx.http
      .get(`${API}/admin/rides/${ride.id}/bookings`)
      .set(bearer(admin))
      .expect(200);
    expect(crew.body.data).toEqual([
      expect.objectContaining({
        reference: mine.body.data[0].reference,
        status: "PENDING_PAYMENT",
        paymentStatus: "UNPAID",
        seats: 1,
        riderName: "Test",
        riderEmail: rider.email,
        contactPhone: "+919876543210",
        amount: 99900,
      }),
    ]);
    // Nobody else's view of the ride carries it.
    const others = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(other.accessToken))
      .expect(200);
    expect(others.body.data).toMatchObject({ registered: false, number: null, contactPhone: null });

    // A later price change doesn't rewrite the booking. Booking again after
    // leaving keeps the number and takes the new details and price.
    await ctx.http
      .patch(`${API}/admin/rides/${ride.id}`)
      .set(bearer(admin))
      .send({ price: null })
      .expect(200);
    expect(
      (await ctx.prisma.rideRegistration.findUniqueOrThrow({ where: { number } })).amount,
    ).toBe(99900);
    await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(rider.accessToken))
      .expect(200);
    const rebooked = await book(rider.accessToken, { contactPhone: "+919000000001" }).expect(201);
    // The ride is free now, so booking again confirms at once.
    expect(rebooked.body.data).toMatchObject({
      number,
      registered: true,
      status: "REGISTERED",
      paymentStatus: "NOT_REQUIRED",
      contactPhone: "+919000000001",
      bikeLabel: null,
      note: null,
      amount: null,
      currency: null,
    });
    expect(await ctx.prisma.rideRegistration.count()).toBe(1);
  });

  it("enforces capacity, including under concurrent joins", async () => {
    const ride = await createRide(ctx.http, admin, { capacity: 3 });
    const riders = await Promise.all(Array.from({ length: 6 }, () => registerUser(ctx.http)));

    const results = await Promise.all(
      riders.map((rider) =>
        ctx.http.post(`${API}/rides/${ride.id}/join`).set(bearer(rider.accessToken)).send(BOOKING),
      ),
    );
    expect(results.filter((result) => result.status === 201)).toHaveLength(3);
    const refused = results.filter((result) => result.status === 422);
    expect(refused).toHaveLength(3);
    expect(refused[0]!.body.error.code).toBe("RIDE_FULL");
    expect(await ctx.prisma.rideRegistration.count({ where: { status: "REGISTERED" } })).toBe(3);

    const publicRide = await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200);
    expect(publicRide.body.data).toMatchObject({ spotsLeft: 0, registrationOpen: false });

    // A cancellation frees exactly one seat, which the next rider can take.
    const winner = riders[results.findIndex((result) => result.status === 201)]!;
    const waiting = riders[results.findIndex((result) => result.status === 422)]!;
    await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(winner.accessToken))
      .expect(200);
    expect((await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200)).body.data).toMatchObject({
      registeredCount: 2,
      spotsLeft: 1,
      registrationOpen: true,
    });
    await ctx.http
      .post(`${API}/rides/${ride.id}/join`)
      .set(bearer(waiting.accessToken))
      .send(BOOKING)
      .expect(201);
    const full = await ctx.http
      .post(`${API}/rides/${ride.id}/join`)
      .set(bearer(winner.accessToken))
      .send(BOOKING)
      .expect(422);
    expect(full.body.error.code).toBe("RIDE_FULL");
    const crew = await ctx.http
      .get(`${API}/admin/rides/${ride.id}/bookings`)
      .set(bearer(admin))
      .expect(200);
    expect(
      crew.body.data.reduce((sum: number, booking: { seats: number }) => sum + booking.seats, 0),
    ).toBe(3);
    expect(crew.body.data.at(-1)).toMatchObject({ status: "CANCELLED", seats: 0 });

    const lowered = await ctx.http
      .patch(`${API}/admin/rides/${ride.id}`)
      .set(bearer(admin))
      .send({ capacity: 2 })
      .expect(422);
    expect(lowered.body.error.details[0].field).toBe("capacity");
  });

  it("refuses cancelled, full, started and draft rides", async () => {
    const rider = await registerUser(ctx.http);
    const cancelled = await createRide(ctx.http, admin, { status: "CANCELLED" });
    const full = await createRide(ctx.http, admin, { status: "FULL" });
    const started = await createRide(ctx.http, admin, {
      startsAt: new Date(Date.now() - 3_600_000).toISOString(),
    });
    const draft = await createRide(ctx.http, admin, { status: "DRAFT" });

    for (const ride of [cancelled, full, started]) {
      const response = await ctx.http
        .post(`${API}/rides/${ride.id}/join`)
        .set(bearer(rider.accessToken))
        .send(BOOKING)
        .expect(422);
      expect(response.body.error.code).toBe("RIDE_CLOSED");
    }
    await ctx.http
      .post(`${API}/rides/${draft.id}/join`)
      .set(bearer(rider.accessToken))
      .send(BOOKING)
      .expect(404);

    // A rider can't leave once the ride has started.
    const soon = await createRide(ctx.http, admin);
    await ctx.http
      .post(`${API}/rides/${soon.id}/join`)
      .set(bearer(rider.accessToken))
      .send(BOOKING)
      .expect(201);
    await ctx.prisma.ride.update({
      where: { id: soon.id },
      data: { startsAt: new Date(Date.now() - 60_000) },
    });
    const late = await ctx.http
      .delete(`${API}/rides/${soon.id}/join`)
      .set(bearer(rider.accessToken))
      .expect(422);
    expect(late.body.error.code).toBe("RIDE_CLOSED");

    const past = await ctx.http.get(`${API}/rides`).query({ when: "past" }).expect(200);
    expect(past.body.data.map((ride: { id: string }) => ride.id)).toEqual(
      expect.arrayContaining([started.id, soon.id]),
    );
  });
});
