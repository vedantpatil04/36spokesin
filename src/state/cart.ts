import { useMemo } from "react";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartLine,
  setCartLineQuantity,
} from "@/services/commerce";
import type { Cart, ID } from "@/types";
import { assertSignedIn, type LoadStatus, useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

/** The API's per-line limit. The API also caps each line at the stock on hand. */
export const MAX_CART_QUANTITY = 10;

export function useCart(): Cart | null {
  const { cart } = useAppStores();
  return useStoreSelector(cart, (state) => state.cart);
}

export function useCartStatus(): LoadStatus {
  const { cart } = useAppStores();
  return useStoreSelector(cart, (state) => state.status);
}

/** Total units in the cart. */
export function useCartCount(): number {
  const { cart } = useAppStores();
  return useStoreSelector(cart, (state) => state.cart?.itemCount ?? 0);
}

export function useCartQuantity(productId: ID): number {
  const { cart } = useAppStores();
  return useStoreSelector(
    cart,
    (state) => state.cart?.lines.find((line) => line.product.id === productId)?.quantity ?? 0,
  );
}

/**
 * Cart changes go to the API; the store is replaced by the cart it returns, so
 * prices and availability always come from the server. Actions throw
 * SignInRequiredError when signed out, and ApiError when the API refuses.
 */
export function useCartActions() {
  const stores = useAppStores();
  return useMemo(() => {
    const apply = async (request: () => Promise<Cart>) => {
      assertSignedIn(stores);
      const cart = await request();
      stores.cart.setState((state) => ({ status: "ready", cart, revision: state.revision + 1 }));
      return cart;
    };
    return {
      add: (productId: ID, quantity = 1) => apply(() => addToCart(productId, quantity)),
      setQuantity: (lineId: ID, quantity: number) =>
        apply(() => setCartLineQuantity(lineId, quantity)),
      remove: (lineId: ID) => apply(() => removeCartLine(lineId)),
      clear: () => apply(() => clearCart()),
      refresh: () => apply(() => getCart()),
    };
  }, [stores]);
}
