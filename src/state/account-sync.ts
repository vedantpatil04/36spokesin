import { getCart, getWishlist } from "@/services/commerce";
import { listMyBikes } from "@/services/garage";
import type { AppStores } from "./app-stores";
import { setMyBikes } from "./garage";

/**
 * Loads the signed-in rider's cart, wishlist and bikes from the API. Each part
 * fails independently, so a slow wishlist never hides the cart.
 */
export async function hydrateAccount(stores: AppStores): Promise<void> {
  stores.cart.setState((state) => ({ ...state, status: "loading" }));
  stores.wishlist.setState((state) => ({ ...state, status: "loading" }));
  stores.garage.setState((state) => ({ ...state, myBikesStatus: "loading" }));

  // Responses are dropped if an action has already stored something newer.
  const cartRevision = stores.cart.getState().revision;
  const wishlistRevision = stores.wishlist.getState().revision;
  const garageRevision = stores.garage.getState().revision;

  await Promise.all([
    getCart().then(
      (cart) =>
        stores.cart.setState((state) =>
          state.revision === cartRevision
            ? { status: "ready", cart, revision: state.revision + 1 }
            : state,
        ),
      () =>
        stores.cart.setState((state) =>
          state.revision === cartRevision ? { ...state, status: "error" } : state,
        ),
    ),
    getWishlist().then(
      (items) =>
        stores.wishlist.setState((state) =>
          state.revision === wishlistRevision
            ? { status: "ready", items, revision: state.revision + 1 }
            : state,
        ),
      () =>
        stores.wishlist.setState((state) =>
          state.revision === wishlistRevision ? { ...state, status: "error" } : state,
        ),
    ),
    listMyBikes().then(
      (bikes) => {
        if (stores.garage.getState().revision === garageRevision) setMyBikes(stores, bikes);
      },
      () =>
        stores.garage.setState((state) =>
          state.revision === garageRevision ? { ...state, myBikesStatus: "error" } : state,
        ),
    ),
  ]);
}

/** Forgets the previous rider's account data on sign-out. The bike selection is kept. */
export function resetAccount(stores: AppStores): void {
  stores.cart.setState((state) => ({ status: "idle", cart: null, revision: state.revision + 1 }));
  stores.wishlist.setState((state) => ({
    status: "idle",
    items: [],
    revision: state.revision + 1,
  }));
  stores.garage.setState((state) => ({
    ...state,
    myBikes: [],
    myBikesStatus: "idle",
    revision: state.revision + 1,
  }));
}
