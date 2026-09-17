import { useEffect, useState, type ReactNode } from "react";
import { features } from "@/lib/env";
import { getCurrentUser, restoreSession } from "@/services/auth";
import { AppStateContext, createAppStores } from "./app-stores";

/** Creates the client stores once per app instance (never shared across SSR requests). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(createAppStores);

  // Restore the session once per app load, using the httpOnly refresh cookie.
  // Runs client-only: the server has no access to that cookie's value here.
  useEffect(() => {
    if (!features.backend) return;
    let cancelled = false;

    restoreSession()
      .then((session) => (session ? getCurrentUser() : null))
      .then((user) => {
        if (!cancelled) {
          stores.auth.setState(() => ({
            status: user ? "authenticated" : "unauthenticated",
            user,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) stores.auth.setState(() => ({ status: "unauthenticated", user: null }));
      });

    return () => {
      cancelled = true;
    };
  }, [stores]);

  return <AppStateContext.Provider value={stores}>{children}</AppStateContext.Provider>;
}
