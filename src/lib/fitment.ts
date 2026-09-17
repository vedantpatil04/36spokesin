import type { ID, Product } from "@/types";

/** Whether a product fits the given motorcycle. Universal gear fits every bike. */
export function fitsBike(product: Product, bikeId: ID): boolean {
  return product.fitment.kind === "universal" || product.fitment.bikeIds.includes(bikeId);
}
