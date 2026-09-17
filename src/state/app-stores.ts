import { createContext, useContext } from "react";
import { DEFAULT_BIKE_ID } from "@/data/bikes";
import type { CartItem, ID, WishlistItem } from "@/types";
import { createStore, type Store } from "./create-store";

/**
 * Client UI state, separate from data.
 *
 *   UI state (this folder)  →  selections, wishlist, cart, in memory only
 *   mock data (src/data)    →  read through src/services
 *   server data (Phase 3+)  →  same services, backed by Supabase
 *
 * Nothing here persists yet. Phase 3 hydrates wishlist and cart from the
 * rider's account and writes changes back through services.
 */

export type GarageState = { selectedBikeId: ID };
export type WishlistState = { items: WishlistItem[] };
export type CartState = { items: CartItem[] };

export type AppStores = {
  garage: Store<GarageState>;
  wishlist: Store<WishlistState>;
  cart: Store<CartState>;
};

export function createAppStores(): AppStores {
  return {
    garage: createStore<GarageState>({ selectedBikeId: DEFAULT_BIKE_ID }),
    wishlist: createStore<WishlistState>({ items: [] }),
    cart: createStore<CartState>({ items: [] }),
  };
}

export const AppStateContext = createContext<AppStores | null>(null);

export function useAppStores(): AppStores {
  const stores = useContext(AppStateContext);
  if (!stores) throw new Error("useAppStores must be used inside <AppStateProvider>.");
  return stores;
}
