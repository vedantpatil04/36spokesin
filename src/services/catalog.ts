import { bikes } from "@/data/bikes";
import { productCategories, products } from "@/data/products";
import { fitsBike } from "@/lib/fitment";
import type { Bike, ID, Product, ProductCategory, ProductCategorySlug } from "@/types";

export async function listBikes(): Promise<Bike[]> {
  return [...bikes];
}

export async function getBikeBySlug(slug: string): Promise<Bike | null> {
  return bikes.find((bike) => bike.slug === slug) ?? null;
}

export async function getBikesByIds(ids: ID[]): Promise<Bike[]> {
  return bikes.filter((bike) => ids.includes(bike.id));
}

export async function listProductCategories(): Promise<ProductCategory[]> {
  return [...productCategories];
}

export async function getProductCategory(slug: string): Promise<ProductCategory | null> {
  return productCategories.find((category) => category.slug === slug) ?? null;
}

export async function listProducts(
  filter: { categorySlug?: ProductCategorySlug } = {},
): Promise<Product[]> {
  const { categorySlug } = filter;
  return categorySlug
    ? products.filter((product) => product.category.slug === categorySlug)
    : [...products];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find((product) => product.slug === slug) ?? null;
}

export async function listProductsForBike(bikeId: ID): Promise<Product[]> {
  return products.filter((product) => fitsBike(product, bikeId));
}

/** Other products in the same category. */
export async function listRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  return products
    .filter((other) => other.id !== product.id && other.category.slug === product.category.slug)
    .slice(0, limit);
}
