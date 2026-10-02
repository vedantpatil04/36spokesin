import { useMemo } from "react";
import { getWishlist, removeFromWishlist, saveToWishlist } from "@/services/commerce";
import type { ID, WishlistItem } from "@/types";
import { assertSignedIn, type LoadStatus, useAppStores } from "./app-stores";
import { useStoreSelector } from "./create-store";

export function useWishlistItems(): WishlistItem[] {
  const { wishlist } = useAppStores();
  return useStoreSelector(wishlist, (state) => state.items);
}

export function useWishlistStatus(): LoadStatus {
  const { wishlist } = useAppStores();
  return useStoreSelector(wishlist, (state) => state.status);
}

export function useIsWishlisted(productId: ID): boolean {
  const { wishlist } = useAppStores();
  return useStoreSelector(wishlist, (state) =>
    state.items.some((item) => item.product.id === productId),
  );
}

/** Saves and removes through the API. Throws SignInRequiredError when signed out. */
export function useWishlistActions() {
  const stores = useAppStores();
  return useMemo(() => {
    const remove = async (itemId: ID) => {
      assertSignedIn(stores);
      await removeFromWishlist(itemId);
      stores.wishlist.setState((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== itemId),
        revision: state.revision + 1,
      }));
    };
    return {
      remove,
      toggle: async (productId: ID) => {
        assertSignedIn(stores);
        const existing = stores.wishlist
          .getState()
          .items.find((item) => item.product.id === productId);
        if (existing) {
          await remove(existing.id);
          return false;
        }
        const item = await saveToWishlist(productId);
        stores.wishlist.setState((state) => ({
          status: "ready",
          items: [item, ...state.items.filter((entry) => entry.id !== item.id)],
          revision: state.revision + 1,
        }));
        return true;
      },
      refresh: async () => {
        assertSignedIn(stores);
        const items = await getWishlist();
        stores.wishlist.setState((state) => ({
          status: "ready",
          items,
          revision: state.revision + 1,
        }));
      },
    };
  }, [stores]);
}
