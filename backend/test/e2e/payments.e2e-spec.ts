import { uploadImage } from "./helpers/catalog-fixtures.js";
import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { InMemoryObjectStorage } from "./helpers/in-memory-storage.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";
import { createRide } from "./helpers/travel-fixtures.js";

const BOOKING = { contactPhone: "+919876543210" };
const PRICE = 99900;

describe("Manual UPI payments for ride bookings", () => {
  let ctx: TestContext;
  let storage: InMemoryObjectStorage;
  let admin: string;

  beforeAll(async () => {
    storage = new InMemoryObjectStorage();
    ctx = await createTestApp({ storage });
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = (await registerAdmin(ctx.http, ctx.prisma)).accessToken;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const configure = () =>
    ctx.http
      .patch(`${API}/admin/payment-settings`)
      .set(bearer(admin))
      .send({ upiId: "crew@okaxis", payeeName: "36 Spokes", instructions: "Pay, then upload." })
      .expect(200);
  const book = (rideId: string, token: string) =>
    ctx.http.post(`${API}/rides/${rideId}/join`).set(bearer(token)).send(BOOKING);
  const submit = (rideId: string, token: string, mediaAssetId: string) =>
    ctx.http.post(`${API}/rides/${rideId}/payment-proof`).set(bearer(token)).send({ mediaAssetId });
  const proof = (token: string) => uploadImage(ctx.http, storage, token, "PAYMENT_PROOF");
  const pending = async () =>
    (await ctx.http.get(`${API}/admin/payments`).set(bearer(admin)).expect(200)).body.data;

  it("keeps the UPI details in the CMS and shows them to signed-in riders only", async () => {
    const rider = await registerUser(ctx.http);
    await ctx.http.get(`${API}/payment-info`).expect(401);
    const empty = await ctx.http
      .get(`${API}/payment-info`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(empty.body.data).toMatchObject({ configured: false, upiId: null, qr: null });

    await ctx.http
      .patch(`${API}/admin/payment-settings`)
      .set(bearer(rider.accessToken))
      .send({ upiId: "mine@upi" })
      .expect(403);
    await ctx.http
      .patch(`${API}/admin/payment-settings`)
      .set(bearer(admin))
      .send({ upiId: "not a upi id" })
      .expect(400);

    const qr = await uploadImage(ctx.http, storage, admin, "SITE");
    const saved = await ctx.http
      .patch(`${API}/admin/payment-settings`)
      .set(bearer(admin))
      .send({ upiId: " crew@okaxis ", payeeName: "36 Spokes", qrMediaId: qr.id })
      .expect(200);
    expect(saved.body.data).toMatchObject({ configured: true, upiId: "crew@okaxis" });
    const info = await ctx.http
      .get(`${API}/payment-info`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(info.body.data).toMatchObject({
      configured: true,
      upiId: "crew@okaxis",
      payeeName: "36 Spokes",
      qr: { id: qr.id, url: expect.any(String) },
    });
    expect(info.body.data).not.toHaveProperty("updatedAt");
    expect(await ctx.prisma.paymentSettings.count()).toBe(1);
  });

  it("holds a seat, takes one proof and confirms the booking only on approval", async () => {
    const ride = await createRide(ctx.http, admin, { price: PRICE, capacity: 2 });
    const rider = await registerUser(ctx.http);
    const other = await registerUser(ctx.http);

    // No UPI details yet: a paid ride can't be booked. A free one still can.
    const refused = await book(ride.id, rider.accessToken).expect(422);
    expect(refused.body.error.code).toBe("PAYMENT_NOT_CONFIGURED");
    const free = await createRide(ctx.http, admin);
    expect((await book(free.id, rider.accessToken).expect(201)).body.data).toMatchObject({
      registered: true,
      status: "REGISTERED",
      paymentStatus: "NOT_REQUIRED",
    });
    await configure();

    const held = await book(ride.id, rider.accessToken).expect(201);
    expect(held.body.data).toMatchObject({
      registered: false,
      status: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
      amount: PRICE,
      holdExpiresAt: expect.any(String),
    });
    // The held seat counts, and a second booking for the same rider is refused.
    expect((await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200)).body.data).toMatchObject({
      registeredCount: 1,
      spotsLeft: 1,
    });
    expect((await book(ride.id, rider.accessToken).expect(409)).body.error.code).toBe(
      "ALREADY_REGISTERED",
    );

    // The proof must be the rider's own payment-proof upload.
    const mine = await proof(rider.accessToken);
    const theirs = await proof(other.accessToken);
    const wrongCategory = await uploadImage(ctx.http, storage, rider.accessToken, "RIDER");
    for (const id of [theirs.id, wrongCategory.id]) {
      const bad = await submit(ride.id, rider.accessToken, id).expect(422);
      expect(bad.body.error.code).toBe("MEDIA_NOT_USABLE");
    }
    // A rider with no booking has nothing to pay for.
    await submit(ride.id, other.accessToken, theirs.id).expect(404);
    expect(await ctx.prisma.payment.count()).toBe(0);

    const submitted = await submit(ride.id, rider.accessToken, mine.id).expect(201);
    expect(submitted.body.data).toMatchObject({
      registered: false,
      status: "PENDING_PAYMENT",
      paymentStatus: "PROOF_SUBMITTED",
      holdExpiresAt: null,
    });
    // The server took the amount from the booking; the client sent none.
    expect(await ctx.prisma.payment.findFirstOrThrow()).toMatchObject({
      provider: "MANUAL_UPI",
      status: "PROOF_SUBMITTED",
      amount: PRICE,
      proofMediaId: mine.id,
    });
    // One proof per attempt, and a used screenshot can't be reused.
    const second = await proof(rider.accessToken);
    await submit(ride.id, rider.accessToken, second.id).expect(409);
    await ctx.http
      .post(`${API}/rides/${ride.id}/payment-proof`)
      .set(bearer(rider.accessToken))
      .send({ mediaAssetId: mine.id, amount: 1 })
      .expect(400);

    // Riders can't see or decide reviews.
    await ctx.http.get(`${API}/admin/payments`).set(bearer(rider.accessToken)).expect(403);
    const [waiting] = await pending();
    expect(waiting).toMatchObject({
      status: "PROOF_SUBMITTED",
      amount: PRICE,
      bookingStatus: "PENDING_PAYMENT",
      reference: submitted.body.data.reference,
      rider: { email: rider.email, phone: "+919876543210" },
      ride: { id: ride.id },
      proofUrl: expect.any(String),
    });
    await ctx.http
      .post(`${API}/admin/payments/${waiting.id}/approve`)
      .set(bearer(rider.accessToken))
      .expect(403);

    const approved = await ctx.http
      .post(`${API}/admin/payments/${waiting.id}/approve`)
      .set(bearer(admin))
      .expect(200);
    expect(approved.body.data).toMatchObject({ status: "PAID", bookingStatus: "REGISTERED" });
    // A proof is decided once.
    await ctx.http
      .post(`${API}/admin/payments/${waiting.id}/reject`)
      .set(bearer(admin))
      .send({ reason: "changed my mind" })
      .expect(409);
    expect(await pending()).toHaveLength(0);

    const confirmed = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(confirmed.body.data).toMatchObject({
      registered: true,
      status: "REGISTERED",
      paymentStatus: "PAID",
    });
    const myRides = await ctx.http
      .get(`${API}/my-rides`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(
      myRides.body.data.find((entry: { ride: { id: string } }) => entry.ride.id === ride.id),
    ).toMatchObject({ status: "REGISTERED", paymentStatus: "PAID" });
    // The seat stayed taken throughout; a confirmed booking takes no more proofs.
    expect((await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200)).body.data).toMatchObject({
      registeredCount: 1,
      spotsLeft: 1,
    });
    await submit(ride.id, rider.accessToken, second.id).expect(409);
  });

  it("keeps a rejected proof as history and lets the rider send another", async () => {
    await configure();
    const ride = await createRide(ctx.http, admin, { price: PRICE });
    const rider = await registerUser(ctx.http);
    await book(ride.id, rider.accessToken).expect(201);
    await submit(ride.id, rider.accessToken, (await proof(rider.accessToken)).id).expect(201);

    const [first] = await pending();
    const rejected = await ctx.http
      .post(`${API}/admin/payments/${first.id}/reject`)
      .set(bearer(admin))
      .send({ reason: "  Amount doesn't match  " })
      .expect(200);
    expect(rejected.body.data).toMatchObject({
      status: "REJECTED",
      rejectionReason: "Amount doesn't match",
      bookingStatus: "PENDING_PAYMENT",
    });
    const afterReject = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(afterReject.body.data).toMatchObject({
      registered: false,
      status: "PENDING_PAYMENT",
      paymentStatus: "REJECTED",
      paymentRejectionReason: "Amount doesn't match",
      // The seat is held again for a fresh window.
      holdExpiresAt: expect.any(String),
    });

    await submit(ride.id, rider.accessToken, (await proof(rider.accessToken)).id).expect(201);
    const [second] = await pending();
    expect(second.id).not.toBe(first.id);
    await ctx.http
      .post(`${API}/admin/payments/${second.id}/approve`)
      .set(bearer(admin))
      .expect(200);

    // One booking, two payments: the rejected one is still there.
    expect(await ctx.prisma.rideRegistration.count()).toBe(1);
    const history = await ctx.http
      .get(`${API}/admin/payments`)
      .query({ status: "all" })
      .set(bearer(admin))
      .expect(200);
    expect(history.body.data.map((payment: { status: string }) => payment.status).sort()).toEqual([
      "PAID",
      "REJECTED",
    ]);
  });

  it("releases a seat when the hold runs out or the booking is cancelled", async () => {
    await configure();
    const ride = await createRide(ctx.http, admin, { price: PRICE, capacity: 1 });
    const slow = await registerUser(ctx.http);
    const next = await registerUser(ctx.http);

    await book(ride.id, slow.accessToken).expect(201);
    expect((await book(ride.id, next.accessToken).expect(422)).body.error.code).toBe("RIDE_FULL");

    // The hold runs out with no proof: the seat is free for the next rider.
    await ctx.prisma.rideRegistration.updateMany({
      data: { holdExpiresAt: new Date(Date.now() - 1000) },
    });
    expect((await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200)).body.data).toMatchObject({
      registeredCount: 0,
      spotsLeft: 1,
    });
    await book(ride.id, next.accessToken).expect(201);
    const lapsed = await ctx.http
      .get(`${API}/rides/${ride.id}/registration`)
      .set(bearer(slow.accessToken))
      .expect(200);
    expect(lapsed.body.data).toMatchObject({
      status: "CANCELLED",
      holdExpired: true,
      paymentStatus: "CANCELLED",
    });
    const late = await submit(ride.id, slow.accessToken, (await proof(slow.accessToken)).id);
    expect(late.status).toBe(409);

    // A proof under review keeps its seat with no deadline; cancelling withdraws it.
    await submit(ride.id, next.accessToken, (await proof(next.accessToken)).id).expect(201);
    const [waiting] = await pending();
    const cancelled = await ctx.http
      .delete(`${API}/rides/${ride.id}/join`)
      .set(bearer(next.accessToken))
      .expect(200);
    expect(cancelled.body.data).toMatchObject({ status: "CANCELLED", holdExpired: false });
    expect(await ctx.prisma.payment.findUniqueOrThrow({ where: { id: waiting.id } })).toMatchObject(
      { status: "CANCELLED" },
    );
    await ctx.http
      .post(`${API}/admin/payments/${waiting.id}/approve`)
      .set(bearer(admin))
      .expect(409);
    const afterCancel = await submit(ride.id, next.accessToken, (await proof(next.accessToken)).id);
    expect(afterCancel.status).toBe(409);
    expect((await ctx.http.get(`${API}/rides/${ride.slug}`).expect(200)).body.data).toMatchObject({
      registeredCount: 0,
      spotsLeft: 1,
    });

    // Booking again starts a clean payment: the old proof doesn't carry over.
    const again = await book(ride.id, next.accessToken).expect(201);
    expect(again.body.data).toMatchObject({ status: "PENDING_PAYMENT", paymentStatus: "UNPAID" });
    expect(await ctx.prisma.rideRegistration.count()).toBe(2);
  });
});
