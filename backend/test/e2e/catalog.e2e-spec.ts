import { bearer, registerAdmin, registerUser } from "./helpers/fixtures.js";
import { createBikeModel, createCategory, createProduct } from "./helpers/catalog-fixtures.js";
import { API, type TestContext, createTestApp, resetDatabase } from "./helpers/test-app.js";

describe("Catalogue and admin product management", () => {
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

  describe("authorization", () => {
    it("requires ADMIN for every catalogue mutation, enforced by the API", async () => {
      const rider = await registerUser(ctx.http);
      const category = await createCategory(ctx.prisma);
      const product = { name: "Crash guard", sku: "CG-1", price: 100, categoryId: category.id };

      await ctx.http.post(`${API}/admin/products`).send(product).expect(401);
      const forbidden = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(rider.accessToken))
        .send(product)
        .expect(403);
      expect(forbidden.body.error.code).toBe("FORBIDDEN");

      for (const [method, path] of [
        ["get", "/admin/products"],
        ["post", "/admin/categories"],
        ["post", "/admin/bikes"],
        ["get", "/admin/media"],
      ] as const) {
        await ctx.http[method](`${API}${path}`).set(bearer(rider.accessToken)).send({}).expect(403);
      }
    });
  });

  describe("products", () => {
    it("creates, edits and publishes a product; only PUBLISHED products reach the storefront", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const category = await createCategory(ctx.prisma, "protect");
      const created = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({
          name: "Adventure Riding Jacket",
          sku: " 36s-jkt-01 ",
          categoryId: category.id,
          price: 849_900,
          compareAtPrice: 999_900,
          stockQuantity: 5,
          specifications: [
            { label: "Shell", value: "Cordura 500D" },
            { groupName: "Fit", label: "Sizes", value: "S–XXL" },
          ],
        })
        .expect(201);

      expect(created.body.data).toMatchObject({
        name: "Adventure Riding Jacket",
        slug: "adventure-riding-jacket",
        sku: "36S-JKT-01",
        status: "DRAFT",
        price: 849_900,
        currency: "INR",
        publishedAt: null,
        maxOrderQuantity: 0,
      });
      expect(created.body.data.specifications.map((spec: { label: string }) => spec.label)).toEqual(
        ["Shell", "Sizes"],
      );

      await ctx.http.get(`${API}/products/adventure-riding-jacket`).expect(404);
      const drafts = await ctx.http.get(`${API}/products`).expect(200);
      expect(drafts.body.data).toHaveLength(0);

      const published = await ctx.http
        .patch(`${API}/admin/products/${created.body.data.id}`)
        .set(bearer(admin.accessToken))
        .send({ status: "PUBLISHED", name: "Adventure Riding Jacket Mk2", specifications: [] })
        .expect(200);
      expect(published.body.data.publishedAt).toEqual(expect.any(String));
      expect(published.body.data.specifications).toHaveLength(0);
      expect(published.body.data.updatedById).toBe(admin.id);

      const detail = await ctx.http.get(`${API}/products/adventure-riding-jacket`).expect(200);
      expect(detail.body.data).toMatchObject({
        name: "Adventure Riding Jacket Mk2",
        maxOrderQuantity: 5,
        images: [],
        primaryImage: null,
      });
      expect(detail.body.data).not.toHaveProperty("status");

      const categories = await ctx.http.get(`${API}/categories`).expect(200);
      expect(categories.body.data[0]).toMatchObject({ slug: "protect", productCount: 1 });

      // Archiving removes it from the storefront but keeps the record.
      await ctx.http
        .delete(`${API}/admin/products/${created.body.data.id}`)
        .set(bearer(admin.accessToken))
        .expect(200);
      await ctx.http.get(`${API}/products/adventure-riding-jacket`).expect(404);
      const archived = await ctx.prisma.product.findUniqueOrThrow({
        where: { id: created.body.data.id },
      });
      expect(archived.status).toBe("ARCHIVED");
    });

    it("rejects duplicate SKUs and slugs, invalid SKUs and incoherent prices", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const category = await createCategory(ctx.prisma);
      await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.id,
        name: "Tail bag",
        sku: "TB-1",
      });

      const duplicateSku = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({ name: "Other", sku: "tb-1", price: 1, categoryId: category.id })
        .expect(409);
      expect(duplicateSku.body.error.code).toBe("SKU_TAKEN");

      const duplicateSlug = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({ name: "Other", slug: "tail-bag", sku: "TB-2", price: 1, categoryId: category.id })
        .expect(409);
      expect(duplicateSlug.body.error.code).toBe("SLUG_TAKEN");

      // Same name without a slug gets a free, generated one.
      const generated = await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.id,
        name: "Tail bag",
        sku: "TB-3",
      });
      expect(generated.slug).toBe("tail-bag-2");

      const badSku = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({ name: "Bad", sku: "has spaces!", price: 1, categoryId: category.id })
        .expect(400);
      expect(badSku.body.error.details[0].field).toBe("sku");

      const badPrice = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({
          name: "Bad",
          sku: "BAD-1",
          price: 500,
          compareAtPrice: 400,
          categoryId: category.id,
        })
        .expect(400);
      expect(badPrice.body.error.details[0].field).toBe("compareAtPrice");

      const badCategory = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({
          name: "Bad",
          sku: "BAD-2",
          price: 1,
          categoryId: "0190f0f0-0000-7000-8000-000000000000",
        })
        .expect(422);
      expect(badCategory.body.error.code).toBe("INVALID_REFERENCE");
    });

    it("validates compatibility and filters the storefront by bike", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const category = await createCategory(ctx.prisma);
      const himalayan = await createBikeModel(ctx.prisma, {
        variants: ["Kaza Brown", "Hanle Black"],
      });
      const other = await createBikeModel(ctx.prisma);

      const wrongVariant = await ctx.http
        .post(`${API}/admin/products`)
        .set(bearer(admin.accessToken))
        .send({
          name: "Rack",
          sku: "RACK-1",
          price: 1,
          categoryId: category.id,
          compatibility: [{ bikeModelId: himalayan.id, bikeVariantId: other.variants[0]!.id }],
        })
        .expect(422);
      expect(wrongVariant.body.error.code).toBe("INVALID_COMPATIBILITY");
      expect(wrongVariant.body.error.details[0].field).toBe("compatibility.0.bikeVariantId");

      const rack = await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.id,
        status: "PUBLISHED",
        compatibility: [
          { bikeModelId: himalayan.id, bikeVariantId: himalayan.variants[0]!.id },
          { bikeModelId: himalayan.id },
          { bikeModelId: himalayan.id },
        ],
      });
      await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.id,
        status: "PUBLISHED",
        universalFit: true,
      });

      const stored = await ctx.prisma.productCompatibility.findMany({
        where: { productId: rack.id },
      });
      expect(stored).toEqual([
        expect.objectContaining({ bikeModelId: himalayan.id, bikeVariantId: null }),
      ]);

      const forBike = await ctx.http
        .get(`${API}/products`)
        .query({ bike: himalayan.id })
        .expect(200);
      expect(forBike.body.data.map((product: { id: string }) => product.id)).toEqual([rack.id]);
      const detail = await ctx.http.get(`${API}/products/${rack.slug}`).expect(200);
      expect(detail.body.data.compatibility[0]).toMatchObject({
        bikeModelName: himalayan.name,
        bikeVariantId: null,
        archived: false,
      });
    });

    it("duplicates a product as a draft and paginates admin lists with filters", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const category = await createCategory(ctx.prisma);
      const source = await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.id,
        name: "Phone mount",
        sku: "MNT-1",
        status: "PUBLISHED",
      });
      const copy = await ctx.http
        .post(`${API}/admin/products/${source.id}/duplicate`)
        .set(bearer(admin.accessToken))
        .expect(201);
      expect(copy.body.data).toMatchObject({
        status: "DRAFT",
        sku: "MNT-1-COPY",
        slug: "phone-mount-copy",
      });

      for (let i = 0; i < 3; i += 1) {
        await createProduct(ctx.http, admin.accessToken, { categoryId: category.id });
      }
      const first = await ctx.http
        .get(`${API}/admin/products`)
        .query({ limit: 3 })
        .set(bearer(admin.accessToken))
        .expect(200);
      expect(first.body.data).toHaveLength(3);
      const second = await ctx.http
        .get(`${API}/admin/products`)
        .query({ limit: 3, cursor: first.body.meta.nextCursor })
        .set(bearer(admin.accessToken))
        .expect(200);
      expect(second.body.data).toHaveLength(2);
      expect(second.body.meta.nextCursor).toBeNull();

      const search = await ctx.http
        .get(`${API}/admin/products`)
        .query({ q: "mnt-1", status: "DRAFT" })
        .set(bearer(admin.accessToken))
        .expect(200);
      expect(search.body.data.map((row: { sku: string }) => row.sku)).toEqual(["MNT-1-COPY"]);
    });
  });

  describe("categories, brands and bikes", () => {
    it("refuses to delete categories and brands still in use", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const category = await ctx.http
        .post(`${API}/admin/categories`)
        .set(bearer(admin.accessToken))
        .send({ name: "Carry", description: "Panniers, tail bags, racks" })
        .expect(201);
      expect(category.body.data.slug).toBe("carry");
      const brand = await ctx.http
        .post(`${API}/admin/brands`)
        .set(bearer(admin.accessToken))
        .send({ name: "36 Spokes Workshop" })
        .expect(201);
      await createProduct(ctx.http, admin.accessToken, {
        categoryId: category.body.data.id,
        brandId: brand.body.data.id,
      });

      const categoryInUse = await ctx.http
        .delete(`${API}/admin/categories/${category.body.data.id}`)
        .set(bearer(admin.accessToken))
        .expect(409);
      expect(categoryInUse.body.error.code).toBe("RESOURCE_IN_USE");
      await ctx.http
        .delete(`${API}/admin/brands/${brand.body.data.id}`)
        .set(bearer(admin.accessToken))
        .expect(409);

      const empty = await createCategory(ctx.prisma);
      await ctx.http
        .delete(`${API}/admin/categories/${empty.id}`)
        .set(bearer(admin.accessToken))
        .expect(204);
    });

    it("manages the bike catalogue; archived bikes leave the public list", async () => {
      const admin = await registerAdmin(ctx.http, ctx.prisma);
      const brand = await ctx.http
        .post(`${API}/admin/bike-brands`)
        .set(bearer(admin.accessToken))
        .send({ name: "Royal Enfield" })
        .expect(201);
      const model = await ctx.http
        .post(`${API}/admin/bikes`)
        .set(bearer(admin.accessToken))
        .send({
          brandId: brand.body.data.id,
          name: "Himalayan 450",
          segment: "ADVENTURE",
          tankLitres: 17,
          fuelEfficiencyKmpl: 30,
          variants: ["Kaza Brown", "kaza brown", "Hanle Black"],
        })
        .expect(201);
      expect(model.body.data.slug).toBe("royal-enfield-himalayan-450");
      expect(model.body.data.variants.map((variant: { name: string }) => variant.name)).toEqual([
        "Kaza Brown",
        "Hanle Black",
      ]);

      const bySlug = await ctx.http.get(`${API}/bikes/royal-enfield-himalayan-450`).expect(200);
      expect(bySlug.body.data.brand.name).toBe("Royal Enfield");
      await ctx.http.get(`${API}/bikes/${model.body.data.id}`).expect(200);

      const variant = model.body.data.variants[1];
      await ctx.http
        .patch(`${API}/admin/bikes/${model.body.data.id}/variants/${variant.id}`)
        .set(bearer(admin.accessToken))
        .send({ archived: true })
        .expect(200);
      const afterVariant = await ctx.http.get(`${API}/bikes/${model.body.data.id}`).expect(200);
      expect(afterVariant.body.data.variants).toHaveLength(1);

      await ctx.http
        .delete(`${API}/admin/bikes/${model.body.data.id}`)
        .set(bearer(admin.accessToken))
        .expect(200);
      const list = await ctx.http.get(`${API}/bikes`).expect(200);
      expect(list.body.data).toHaveLength(0);
      await ctx.http.get(`${API}/bikes/royal-enfield-himalayan-450`).expect(404);

      const adminList = await ctx.http
        .get(`${API}/admin/bikes`)
        .set(bearer(admin.accessToken))
        .expect(200);
      expect(adminList.body.data[0].archivedAt).toEqual(expect.any(String));
    });
  });
});
