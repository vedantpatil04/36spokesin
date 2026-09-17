import { useMemo } from "react";
import type { ID, WishlistItem } from "@/types";
import { useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

export function useWishlistItems(): WishlistItem[] {
  const { wishlist } = useAppStores();
  return useStoreSelector(wishlist, (state) => state.items);
}

export function useIsWishlisted(productId: ID): boolean {
  const { wishlist } = useAppStores();
  return useStoreSelector(wishlist, (state) =>
    state.items.some((item) => item.productId === productId),
  );
}

export function useWishlistActions() {
  const { wishlist } = useAppStores();
  return useMemo(
    () => ({
      toggle: (productId: ID) =>
        wishlist.setState((state) =>
          state.items.some((item) => item.productId === productId)
            ? { items: state.items.filter((item) => item.productId !== productId) }
            : { items: [...state.items, { productId, addedAt: new Date().toISOString() }] },
        ),
      remove: (productId: ID) =>
        wishlist.setState((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      clear: () => wishlist.setState(() => ({ items: [] })),
    }),
    [wishlist],
  );
}
