import { useMemo } from "react";
import type { CartItem, ID } from "@/types";
import { useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

export const MAX_CART_QUANTITY = 10;

const clampQuantity = (quantity: number) =>
  Math.max(1, Math.min(MAX_CART_QUANTITY, Math.round(quantity)));

export function useCartItems(): CartItem[] {
  const { cart } = useAppStores();
  return useStoreSelector(cart, (state) => state.items);
}

/** Total units in the cart. */
export function useCartCount(): number {
  const { cart } = useAppStores();
  return useStoreSelector(cart, (state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
}

export function useCartQuantity(productId: ID): number {
  const { cart } = useAppStores();
  return useStoreSelector(
    cart,
    (state) => state.items.find((item) => item.productId === productId)?.quantity ?? 0,
  );
}

export function useCartActions() {
  const { cart } = useAppStores();
  return useMemo(
    () => ({
      add: (productId: ID, quantity = 1) =>
        cart.setState((state) => {
          const existing = state.items.find((item) => item.productId === productId);
          if (!existing) {
            return { items: [...state.items, { productId, quantity: clampQuantity(quantity) }] };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
                : item,
            ),
          };
        }),
      setQuantity: (productId: ID, quantity: number) =>
        cart.setState((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item,
          ),
        })),
      remove: (productId: ID) =>
        cart.setState((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      clear: () => cart.setState(() => ({ items: [] })),
    }),
    [cart],
  );
}
