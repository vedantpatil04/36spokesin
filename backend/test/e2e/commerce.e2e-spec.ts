import { OrdersService } from "../../src/commerce/orders.service.js";
import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { createCategory, createProduct } from "./helpers/catalog-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Cart, wishlist and orders", () => {
  let ctx: TestContext;
  let adminToken: string;
  let categoryId: string;

  const publish = (body: Record<string, unknown> = {}) =>
    createProduct(ctx.http, adminToken, {
      categoryId,
      status: "PUBLISHED",
      stockQuantity: 5,
      ...body,
    });

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    adminToken = (await registerAdmin(ctx.http, ctx.prisma)).accessToken;
    categoryId = (await createCategory(ctx.prisma)).id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it("requires a signed-in rider", async () => {
    await ctx.http.get(`${API}/cart`).expect(401);
    await ctx.http.get(`${API}/wishlist`).expect(401);
    await ctx.http.get(`${API}/orders`).expect(401);
  });

  it("keeps a server-side cart priced from the live catalogue", async () => {
    const rider = await registerUser(ctx.http);
    const jacket = await publish({ price: 849_900 });
    const gloves = await publish({ price: 199_900 });

    await ctx.http
      .post(`${API}/cart/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: jacket.id })
      .expect(201);
    const cart = await ctx.http
      .post(`${API}/cart/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: jacket.id, quantity: 2 })
      .expect(201);
    await ctx.http
      .post(`${API}/cart/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: gloves.id })
      .expect(201);
    expect(cart.body.data).toMatchObject({
      itemCount: 3,
      subtotal: 2_549_700,
      readyForCheckout: true,
    });

    // A price change is reflected on the next read.
    await ctx.http
      .patch(`${API}/admin/products/${jacket.id}`)
      .set(bearer(adminToken))
      .send({ price: 799_900 })
      .expect(200);
    const repriced = await ctx.http.get(`${API}/cart`).set(bearer(rider.accessToken)).expect(200);
    expect(repriced.body.data.subtotal).toBe(799_900 * 3 + 199_900);

    const jacketLine = repriced.body.data.items.find(
      (item: { product: { id: string } }) => item.product.id === jacket.id,
    );
    const tooMany = await ctx.http
      .patch(`${API}/cart/items/${jacketLine.id}`)
      .set(bearer(rider.accessToken))
      .send({ quantity: 6 })
      .expect(422);
    expect(tooMany.body.error.code).toBe("INVALID_QUANTITY");
    await ctx.http
      .patch(`${API}/cart/items/${jacketLine.id}`)
      .set(bearer(rider.accessToken))
      .send({ quantity: 0 })
      .expect(400);

    // Another rider cannot touch this line.
    const other = await registerUser(ctx.http);
    await ctx.http
      .delete(`${API}/cart/items/${jacketLine.id}`)
      .set(bearer(other.accessToken))
      .expect(404);

    // Archiving flags the line instead of silently dropping it.
    await ctx.http.delete(`${API}/admin/products/${gloves.id}`).set(bearer(adminToken)).expect(200);
    const flagged = await ctx.http.get(`${API}/cart`).set(bearer(rider.accessToken)).expect(200);
    const glovesLine = flagged.body.data.items.find(
      (item: { product: { id: string } }) => item.product.id === gloves.id,
    );
    expect(glovesLine.issue).toBe("NOT_AVAILABLE");
    expect(flagged.body.data.readyForCheckout).toBe(false);

    const removed = await ctx.http
      .delete(`${API}/cart/items/${glovesLine.id}`)
      .set(bearer(rider.accessToken))
      .expect(200);
    expect(removed.body.data.items).toHaveLength(1);
    const cleared = await ctx.http.delete(`${API}/cart`).set(bearer(rider.accessToken)).expect(200);
    expect(cleared.body.data).toMatchObject({ items: [], itemCount: 0, subtotal: 0 });
  });

  it("refuses products that cannot be bought", async () => {
    const rider = await registerUser(ctx.http);
    const draft = await createProduct(ctx.http, adminToken, { categoryId });
    const soldOut = await publish({ stockStatus: "OUT_OF_STOCK", stockQuantity: 0 });
    const backorder = await publish({ stockStatus: "BACKORDER", stockQuantity: 0 });

    for (const productId of [draft.id, soldOut.id, "0190f0f0-0000-7000-8000-000000000000"]) {
      const response = await ctx.http
        .post(`${API}/cart/items`)
        .set(bearer(rider.accessToken))
        .send({ productId })
        .expect(422);
      expect(response.body.error.code).toBe("PRODUCT_UNAVAILABLE");
    }
    await ctx.http
      .post(`${API}/cart/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: backorder.id, quantity: 4 })
      .expect(201);
  });

  it("keeps an idempotent wishlist", async () => {
    const rider = await registerUser(ctx.http);
    const product = await publish();
    const first = await ctx.http
      .post(`${API}/wishlist/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: product.id })
      .expect(201);
    const again = await ctx.http
      .post(`${API}/wishlist/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: product.id })
      .expect(201);
    expect(again.body.data.id).toBe(first.body.data.id);
    expect(await ctx.prisma.wishlistItem.count()).toBe(1);

    const list = await ctx.http.get(`${API}/wishlist`).set(bearer(rider.accessToken)).expect(200);
    expect(list.body.data[0]).toMatchObject({ available: true, product: { id: product.id } });

    const other = await registerUser(ctx.http);
    await ctx.http
      .delete(`${API}/wishlist/items/${first.body.data.id}`)
      .set(bearer(other.accessToken))
      .expect(404);
    await ctx.http
      .delete(`${API}/wishlist/items/${first.body.data.id}`)
      .set(bearer(rider.accessToken))
      .expect(204);
  });

  it("snapshots the cart into an order whose history survives catalogue edits", async () => {
    const rider = await registerUser(ctx.http);
    const product = await publish({ name: "Tank bag", sku: "TNK-1", price: 450_000 });
    await ctx.http
      .post(`${API}/cart/items`)
      .set(bearer(rider.accessToken))
      .send({ productId: product.id, quantity: 2 })
      .expect(201);

    const riderPrincipal = { id: rider.id, role: "RIDER" as const, sessionId: "test" };
    const order = await ctx.app.get(OrdersService).createFromCart(riderPrincipal);
    expect(order).toMatchObject({ status: "PENDING_PAYMENT", subtotal: 900_000, total: 900_000 });

    await ctx.http
      .patch(`${API}/admin/products/${product.id}`)
      .set(bearer(adminToken))
      .send({ name: "Tank bag v2", price: 1 })
      .expect(200);

    const orders = await ctx.http.get(`${API}/orders`).set(bearer(rider.accessToken)).expect(200);
    expect(orders.body.data[0].items[0]).toMatchObject({
      productName: "Tank bag",
      sku: "TNK-1",
      unitPrice: 450_000,
      quantity: 2,
      total: 900_000,
    });
    const cart = await ctx.http.get(`${API}/cart`).set(bearer(rider.accessToken)).expect(200);
    expect(cart.body.data.items).toHaveLength(0);

    const other = await registerUser(ctx.http);
    await ctx.http.get(`${API}/orders/${order.id}`).set(bearer(other.accessToken)).expect(404);
  });
});
