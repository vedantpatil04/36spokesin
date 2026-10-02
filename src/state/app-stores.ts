import { createContext, useContext } from "react";
import type { ApiUser } from "@/lib/api";
import { features } from "@/lib/env";
import type { Cart, GarageBike, ID, WishlistItem } from "@/types";
import { createStore, type Store } from "./create-store";

/**
 * Client UI state, separate from data.
 *
 *   UI state (this folder)  →  selections, auth, and client copies of account data
 *   catalogue data          →  src/services, read by route loaders from the API
 *
 * Cart, wishlist and the rider's bikes live on the server. The stores below hold
 * the latest copy the API returned, loaded when the rider signs in (see
 * AppStateProvider) and replaced by the API's response after every change.
 * Nothing is kept in localStorage.
 */

/** `idle` before the rider signs in; `ready` once the server copy has loaded. */
export type LoadStatus = "idle" | "loading" | "ready" | "error";

/**
 * `revision` counts server responses applied to a store. The sign-in load only
 * applies its (older) response when nothing newer has landed since it started,
 * so a quick "add to cart" right after signing in is never overwritten.
 */
export type GarageState = {
  /** The model the visitor is shopping and planning for. Null until they choose one. */
  selectedBikeId: ID | null;
  /** The signed-in rider's own bikes. */
  myBikes: GarageBike[];
  myBikesStatus: LoadStatus;
  revision: number;
};
export type WishlistState = { status: LoadStatus; items: WishlistItem[]; revision: number };
export type CartState = { status: LoadStatus; cart: Cart | null; revision: number };

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
    garage: createStore<GarageState>({
      selectedBikeId: null,
      myBikes: [],
      myBikesStatus: "idle",
      revision: 0,
    }),
    wishlist: createStore<WishlistState>({ status: "idle", items: [], revision: 0 }),
    cart: createStore<CartState>({ status: "idle", cart: null, revision: 0 }),
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

/** Thrown by account actions (cart, wishlist, garage) when nobody is signed in. */
export class SignInRequiredError extends Error {
  constructor() {
    super("Sign in to continue.");
    this.name = "SignInRequiredError";
  }
}

export function assertSignedIn(stores: AppStores): void {
  if (stores.auth.getState().status !== "authenticated") throw new SignInRequiredError();
}
