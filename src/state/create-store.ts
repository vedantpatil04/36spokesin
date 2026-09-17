import { useSyncExternalStore } from "react";

/**
 * Minimal observable store for client UI state.
 *
 * Stores are created per app instance (see AppStateProvider), never at module
 * scope, so server renders never share state between requests.
 */
export type Store<T> = {
  getState: () => T;
  setState: (update: (state: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<T>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    setState: (update) => {
      const next = update(state);
      if (Object.is(next, state)) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Subscribes to a slice of a store. The selector must return a primitive or a
 * reference already held in state (not a newly built array or object), or the
 * component will re-render on every store change.
 */
export function useStoreSelector<T, S>(store: Store<T>, selector: (state: T) => S): S {
  const getSnapshot = () => selector(store.getState());
  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
