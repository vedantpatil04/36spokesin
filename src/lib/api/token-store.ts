/**
 * Where the short-lived access token lives. Only in memory, never in
 * localStorage, so injected scripts cannot lift a long-lived credential; a page
 * reload restores the session through the httpOnly refresh cookie.
 */
export interface AccessTokenStore {
  get(): string | null;
  set(token: string | null): void;
}

export function createMemoryTokenStore(): AccessTokenStore {
  let token: string | null = null;
  return {
    get: () => token,
    set: (next) => {
      token = next;
    },
  };
}

/**
 * Browser-only store. During server rendering it holds nothing, so one
 * visitor's token can never leak into another visitor's request.
 */
export function createBrowserTokenStore(): AccessTokenStore {
  const memory = createMemoryTokenStore();
  const isBrowser = typeof window !== "undefined";
  return {
    get: () => (isBrowser ? memory.get() : null),
    set: (token) => {
      if (isBrowser) memory.set(token);
    },
  };
}
