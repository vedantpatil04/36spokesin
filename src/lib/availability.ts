import type { Product } from "@/types";

/** Short stock line for cards and product pages. */
export function availabilityLabel(
  product: Pick<Product, "stockStatus" | "stockQuantity" | "inStock">,
): string {
  if (!product.inStock) return "Out of stock";
  switch (product.stockStatus) {
    case "backorder":
      return "Available to order";
    case "low_stock":
      return product.stockQuantity > 0 ? `Only ${product.stockQuantity} left` : "Low stock";
    default:
      return "In stock";
  }
}
