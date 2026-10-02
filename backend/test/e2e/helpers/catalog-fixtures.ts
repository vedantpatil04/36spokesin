import type { PrismaService } from "../../../src/database/prisma.service.js";
import { TINY_PNG, bearer } from "./fixtures.js";
import type { InMemoryObjectStorage } from "./in-memory-storage.js";
import { API, type Http } from "./test-app.js";

let sequence = 0;
const next = () => (sequence += 1);

export async function createCategory(prisma: PrismaService, slug = `category-${next()}`) {
  return prisma.productCategory.create({ data: { slug, name: slug.replace(/-/g, " ") } });
}

export async function createBikeModel(
  prisma: PrismaService,
  options: { archived?: boolean; variants?: string[] } = {},
) {
  const n = next();
  const brand = await prisma.bikeBrand.create({ data: { slug: `brand-${n}`, name: `Brand ${n}` } });
  return prisma.bikeModel.create({
    data: {
      brandId: brand.id,
      slug: `brand-${n}-model`,
      name: `Model ${n}`,
      segment: "ADVENTURE",
      archivedAt: options.archived ? new Date() : null,
      variants: {
        create: (options.variants ?? ["Standard"]).map((name, sortOrder) => ({ name, sortOrder })),
      },
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
}

/** Creates a product through the admin API, so the tests exercise the real write path. */
export async function createProduct(
  http: Http,
  adminToken: string,
  body: Record<string, unknown>,
): Promise<{ id: string; slug: string; sku: string }> {
  const n = next();
  const response = await http
    .post(`${API}/admin/products`)
    .set(bearer(adminToken))
    .send({ name: `Product ${n}`, sku: `SKU-${n}`, price: 100_000, ...body });
  if (response.status !== 201) {
    throw new Error(`createProduct failed: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.data;
}

/** Runs the real signed-upload flow against the in-memory storage and returns the READY asset. */
export async function uploadImage(
  http: Http,
  storage: InMemoryObjectStorage,
  token: string,
  category = "PRODUCT",
): Promise<{ id: string; storageKey: string }> {
  const start = await http
    .post(`${API}/media/uploads`)
    .set(bearer(token))
    .send({
      fileName: `photo-${next()}.png`,
      mimeType: "image/png",
      fileSize: TINY_PNG.length,
      category,
    })
    .expect(201);
  const key = new URL(start.body.data.upload.url).pathname.replace(/^\/bucket\//, "");
  storage.simulateUpload(key, TINY_PNG, "image/png");
  await http
    .post(`${API}/media/${start.body.data.asset.id}/complete`)
    .set(bearer(token))
    .expect(200);
  return { id: start.body.data.asset.id, storageKey: key };
}
