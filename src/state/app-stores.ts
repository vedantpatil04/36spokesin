import { createContext, useContext } from "react";
import { DEFAULT_BIKE_ID } from "@/data/bikes";
import type { ApiUser } from "@/lib/api";
import { features } from "@/lib/env";
import type { CartItem, ID, WishlistItem } from "@/types";
import { createStore, type Store } from "./create-store";

/**
 * Client UI state, separate from data.
 *
 *   UI state (this folder)  →  selections, wishlist, cart, auth, in memory only
 *   mock data (src/data)    →  read through src/services
 *   server data             →  same services, backed by the 36 Spokes API
 *
 * Nothing here persists across a page load except `auth`, which rehydrates
 * from the httpOnly refresh cookie (see AppStateProvider). A later phase
 * hydrates wishlist and cart from the rider's account too.
 */

export type GarageState = { selectedBikeId: ID };
export type WishlistState = { items: WishlistItem[] };
export type CartState = { items: CartItem[] };

/** `loading` until the session restore (or its absence) resolves. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type AuthState = { status: AuthStatus; user: ApiUser | null };

export type AppStores = {
  garage: Store<GarageState>;
  wishlist: Store<WishlistState>;
  cart: Store<CartState>;
  auth: Store<AuthState>;
};

export function createAppStores(): AppStores {
  return {
    garage: createStore<GarageState>({ selectedBikeId: DEFAULT_BIKE_ID }),
    wishlist: createStore<WishlistState>({ items: [] }),
    cart: createStore<CartState>({ items: [] }),
    auth: createStore<AuthState>({
      status: features.backend ? "loading" : "unauthenticated",
      user: null,
    }),
  };
}

export const AppStateContext = createContext<AppStores | null>(null);

export function useAppStores(): AppStores {
  const stores = useContext(AppStateContext);
  if (!stores) throw new Error("useAppStores must be used inside <AppStateProvider>.");
  return stores;
}
