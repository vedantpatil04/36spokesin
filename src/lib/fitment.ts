import type { ID, Product } from "@/types";

/**
 * Whether a product fits a motorcycle. Universal gear fits every bike. A fit
 * limited to one variant counts when the variant is unknown or matches.
 */
export function fitsBike(product: Product, bikeId: ID | null, variantId?: ID | null): boolean {
  if (product.fitment.kind === "universal") return true;
  if (!bikeId) return false;
  return product.fitment.fits.some(
    (fit) => fit.bikeId === bikeId && (!fit.variantId || !variantId || fit.variantId === variantId),
  );
}
