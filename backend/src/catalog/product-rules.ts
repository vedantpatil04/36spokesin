import { ProductStatus, StockStatus } from "../generated/prisma/enums.js";

/** Most units of one product a rider can hold in their cart. */
export const MAX_LINE_QUANTITY = 10;

type StockFields = { status: ProductStatus; stockStatus: StockStatus; stockQuantity: number };

/**
 * How many units can be ordered right now. Zero means not purchasable.
 *   - only PUBLISHED products are sold;
 *   - OUT_OF_STOCK never; BACKORDER always (ships when restocked);
 *   - IN_STOCK / LOW_STOCK up to the units on hand.
 */
export function maxOrderQuantity(product: StockFields): number {
  if (product.status !== ProductStatus.PUBLISHED) return 0;
  if (product.stockStatus === StockStatus.OUT_OF_STOCK) return 0;
  if (product.stockStatus === StockStatus.BACKORDER) return MAX_LINE_QUANTITY;
  return Math.max(0, Math.min(MAX_LINE_QUANTITY, product.stockQuantity));
}

export type UnavailableReason = "NOT_AVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK";

/** Why a cart line cannot be bought as it stands, or null when it can. */
export function unavailableReason(
  product: StockFields,
  quantity: number,
): UnavailableReason | null {
  if (product.status !== ProductStatus.PUBLISHED) return "NOT_AVAILABLE";
  const max = maxOrderQuantity(product);
  if (max === 0) return "OUT_OF_STOCK";
  if (quantity > max) return "INSUFFICIENT_STOCK";
  return null;
}
