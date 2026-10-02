/**
 * Admin CMS: products, product images, categories and brands.
 *
 * Unlike the storefront services, these return the API's own shapes: the CMS
 * edits records field for field (status, SKU, prices in paise), so a UI model
 * would only rename them. Every call needs an ADMIN access token; the API
 * enforces the role on each request.
 */

import { getApiClient } from "@/lib/api";
import type {
  ApiAdminProduct,
  ApiAdminProductListItem,
  ApiBrand,
  ApiCategory,
  ApiPage,
  ApiProductImageList,
  ApiProductStatus,
  ApiStockStatus,
} from "@/lib/api";

export type AdminProductSort =
  "updated_desc" | "created_desc" | "name_asc" | "price_asc" | "price_desc" | "stock_asc";

export type AdminProductQuery = {
  q?: string | undefined;
  status?: ApiProductStatus | undefined;
  categoryId?: string | undefined;
  sort?: AdminProductSort | undefined;
  cursor?: string | null | undefined;
  limit?: number;
};

export type ProductSpecificationInput = { groupName: string | null; label: string; value: string };
export type ProductCompatibilityInput = {
  bikeModelId: string;
  bikeVariantId: string | null;
  note?: string | null;
};

/** Mirrors the API's CreateProductDto. Prices are in paise. */
export type ProductInput = {
  name: string;
  slug?: string;
  sku: string;
  categoryId: string;
  brandId: string | null;
  shortDescription: string | null;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  status: ApiProductStatus;
  featured: boolean;
  stockQuantity: number;
  stockStatus: ApiStockStatus;
  weightGrams: number | null;
  universalFit: boolean;
  specifications: ProductSpecificationInput[];
  compatibility: ProductCompatibilityInput[];
};

const api = () => getApiClient();

export function listAdminProducts(
  query: AdminProductQuery,
): Promise<ApiPage<ApiAdminProductListItem>> {
  return api().requestPage<ApiAdminProductListItem>("/admin/products", {
    query: {
      q: query.q || undefined,
      status: query.status,
      categoryId: query.categoryId,
      sort: query.sort,
      cursor: query.cursor ?? undefined,
      limit: query.limit ?? 25,
    },
  });
}

export const getAdminProduct = (id: string) =>
  api().request<ApiAdminProduct>(`/admin/products/${id}`);

export const createProduct = (input: ProductInput) =>
  api().request<ApiAdminProduct>("/admin/products", { method: "POST", body: input });

export const updateProduct = (id: string, input: Partial<ProductInput>) =>
  api().request<ApiAdminProduct>(`/admin/products/${id}`, { method: "PATCH", body: input });

export const archiveProduct = (id: string) =>
  api().request<ApiAdminProduct>(`/admin/products/${id}`, { method: "DELETE" });

export const duplicateProduct = (id: string) =>
  api().request<ApiAdminProduct>(`/admin/products/${id}/duplicate`, { method: "POST" });

// ─── Gallery ─────────────────────────────────────────────────────────────

export const attachProductImage = (
  productId: string,
  body: { mediaAssetId: string; altText?: string | null; isPrimary?: boolean },
) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images`, {
    method: "POST",
    body,
  });

export const updateProductImage = (
  productId: string,
  imageId: string,
  body: { altText?: string | null; caption?: string | null },
) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body,
  });

export const removeProductImage = (productId: string, imageId: string) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });

export const reorderProductImages = (productId: string, imageIds: string[]) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images/reorder`, {
    method: "POST",
    body: { imageIds },
  });

export const setPrimaryProductImage = (productId: string, imageId: string) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images/${imageId}/primary`, {
    method: "POST",
  });

export const replaceProductImage = (productId: string, imageId: string, mediaAssetId: string) =>
  api().request<ApiProductImageList>(`/admin/products/${productId}/images/${imageId}/replace`, {
    method: "POST",
    body: { mediaAssetId },
  });

// ─── Categories and brands ───────────────────────────────────────────────

export type CategoryInput = {
  name: string;
  slug?: string;
  description: string | null;
  sortOrder: number;
  imageMediaId?: string | null;
};

export const listAdminCategories = () => api().request<ApiCategory[]>("/admin/categories");

export const createCategory = (input: CategoryInput) =>
  api().request<ApiCategory>("/admin/categories", { method: "POST", body: input });

export const updateCategory = (id: string, input: Partial<CategoryInput>) =>
  api().request<ApiCategory>(`/admin/categories/${id}`, { method: "PATCH", body: input });

export const deleteCategory = (id: string) =>
  api().request<void>(`/admin/categories/${id}`, { method: "DELETE" });

export const listBrands = () => api().request<ApiBrand[]>("/admin/brands");

export const createBrand = (input: { name: string; slug?: string }) =>
  api().request<ApiBrand>("/admin/brands", { method: "POST", body: input });

export const updateBrand = (id: string, input: { name?: string; slug?: string }) =>
  api().request<ApiBrand>(`/admin/brands/${id}`, { method: "PATCH", body: input });

export const deleteBrand = (id: string) =>
  api().request<void>(`/admin/brands/${id}`, { method: "DELETE" });
