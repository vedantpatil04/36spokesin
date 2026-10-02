/**
 * Cart, wishlist and orders for the signed-in rider, stored by the API.
 * Browser only: these requests need the rider's access token. Checkout and
 * payment are not part of Phase 4.
 */

import { getApiClient } from "@/lib/api";
import type { ApiCart, ApiOrder, ApiOrderStatus, ApiWishlistItem } from "@/lib/api";
import { minorToRupees } from "@/lib/money";
import type { Cart, CartLineIssue, ID, Order, OrderStatus, WishlistItem } from "@/types";
import { toProduct } from "./catalog-mappers";

const ISSUE: Record<NonNullable<ApiCart["items"][number]["issue"]>, CartLineIssue> = {
  NOT_AVAILABLE: "not_available",
  OUT_OF_STOCK: "out_of_stock",
  INSUFFICIENT_STOCK: "insufficient_stock",
};

const ORDER_STATUS: Record<ApiOrderStatus, OrderStatus> = {
  PENDING_PAYMENT: "pending_payment",
  PLACED: "placed",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export function toCart(api: ApiCart): Cart {
  return {
    lines: api.items.map((line) => ({
      id: line.id,
      product: toProduct(line.product),
      quantity: line.quantity,
      unitPrice: minorToRupees(line.unitPrice),
      lineTotal: minorToRupees(line.lineTotal),
      issue: line.issue ? ISSUE[line.issue] : null,
    })),
    itemCount: api.itemCount,
    subtotal: minorToRupees(api.subtotal),
    readyForCheckout: api.readyForCheckout,
  };
}

function toWishlistItem(api: ApiWishlistItem): WishlistItem {
  return {
    id: api.id,
    product: toProduct(api.product),
    available: api.available,
    addedAt: api.addedAt,
  };
}

function toOrder(api: ApiOrder): Order {
  return {
    id: api.id,
    number: String(api.number),
    status: ORDER_STATUS[api.status],
    items: api.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: minorToRupees(item.unitPrice),
    })),
    total: minorToRupees(api.total),
    placedAt: api.placedAt ?? api.createdAt,
  };
}

export async function getCart(): Promise<Cart> {
  return toCart(await getApiClient().request<ApiCart>("/cart"));
}

export async function addToCart(productId: ID, quantity = 1): Promise<Cart> {
  return toCart(
    await getApiClient().request<ApiCart>("/cart/items", {
      method: "POST",
      body: { productId, quantity },
    }),
  );
}

export async function setCartLineQuantity(lineId: ID, quantity: number): Promise<Cart> {
  return toCart(
    await getApiClient().request<ApiCart>(`/cart/items/${lineId}`, {
      method: "PATCH",
      body: { quantity },
    }),
  );
}

export async function removeCartLine(lineId: ID): Promise<Cart> {
  return toCart(
    await getApiClient().request<ApiCart>(`/cart/items/${lineId}`, { method: "DELETE" }),
  );
}

export async function clearCart(): Promise<Cart> {
  return toCart(await getApiClient().request<ApiCart>("/cart", { method: "DELETE" }));
}

export async function getWishlist(): Promise<WishlistItem[]> {
  return (await getApiClient().request<ApiWishlistItem[]>("/wishlist")).map(toWishlistItem);
}

export async function saveToWishlist(productId: ID): Promise<WishlistItem> {
  return toWishlistItem(
    await getApiClient().request<ApiWishlistItem>("/wishlist/items", {
      method: "POST",
      body: { productId },
    }),
  );
}

export async function removeFromWishlist(itemId: ID): Promise<void> {
  await getApiClient().request<void>(`/wishlist/items/${itemId}`, { method: "DELETE" });
}

export async function listOrders(): Promise<Order[]> {
  const page = await getApiClient().requestPage<ApiOrder>("/orders", { query: { limit: 50 } });
  return page.items.map(toOrder);
}
