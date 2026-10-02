/**
 * Shop and bike catalogue, served by the 36 Spokes API. Public endpoints only,
 * so these work in route loaders on the server as well as in the browser.
 * Admins change this data in the CMS; there is no bundled product data.
 */

import { getApiClient } from "@/lib/api";
import type { ApiBikeModel, ApiCategory, ApiProductDetail, ApiProductSummary } from "@/lib/api";
import type {
  Bike,
  ID,
  Product,
  ProductCategory,
  ProductCategorySlug,
  ProductDetail,
  ProductPage,
} from "@/types";
import { toBike, toCategory, toProduct, toProductDetail } from "./catalog-mappers";
import { orNull } from "./request-helpers";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export type ProductFilter = {
  categorySlug?: ProductCategorySlug;
  /** Only products confirmed to fit this bike model (universal gear excluded). */
  bikeId?: ID;
  variantId?: ID;
  featured?: boolean;
  sort?: ProductSort;
  limit?: number;
  cursor?: string | null;
};

export const PRODUCT_PAGE_SIZE = 24;

export async function listBikes(): Promise<Bike[]> {
  const bikes = await getApiClient().request<ApiBikeModel[]>("/bikes", { auth: false });
  return bikes.map(toBike);
}

export async function getBikeBySlug(slug: string): Promise<Bike | null> {
  const bike = await orNull(
    getApiClient().request<ApiBikeModel>(`/bikes/${encodeURIComponent(slug)}`, { auth: false }),
  );
  return bike ? toBike(bike) : null;
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  const categories = await getApiClient().request<ApiCategory[]>("/categories", { auth: false });
  return categories.map(toCategory);
}

export async function getProductCategory(slug: string): Promise<ProductCategory | null> {
  const category = await orNull(
    getApiClient().request<ApiCategory>(`/categories/${encodeURIComponent(slug)}`, { auth: false }),
  );
  return category ? toCategory(category) : null;
}

export async function listProductPage(filter: ProductFilter = {}): Promise<ProductPage> {
  const page = await getApiClient().requestPage<ApiProductSummary>("/products", {
    auth: false,
    query: {
      category: filter.categorySlug,
      bike: filter.bikeId,
      variant: filter.variantId,
      featured: filter.featured,
      sort: filter.sort,
      limit: filter.limit ?? PRODUCT_PAGE_SIZE,
      cursor: filter.cursor ?? undefined,
    },
  });
  return { products: page.items.map(toProduct), nextCursor: page.meta.nextCursor };
}

/** The first page of products matching `filter`. */
export async function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  return (await listProductPage(filter)).products;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const product = await orNull(
    getApiClient().request<ApiProductDetail>(`/products/${encodeURIComponent(slug)}`, {
      auth: false,
    }),
  );
  return product ? toProductDetail(product) : null;
}

/** Products confirmed to fit a bike model. Rider gear that fits everything is not included. */
export async function listProductsForBike(
  bikeId: ID,
  limit = PRODUCT_PAGE_SIZE,
): Promise<Product[]> {
  return listProducts({ bikeId, limit });
}

/** Other products in the same category. */
export async function listRelatedProducts(
  product: Pick<Product, "slug">,
  limit = 4,
): Promise<Product[]> {
  const related = await getApiClient().request<ApiProductSummary[]>(
    `/products/${encodeURIComponent(product.slug)}/related`,
    { auth: false, query: { limit } },
  );
  return related.map(toProduct);
}
