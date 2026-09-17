import { useState, type ReactNode } from "react";
import { AppStateContext, createAppStores } from "./app-stores";

/** Creates the client stores once per app instance (never shared across SSR requests). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [stores] = useState(createAppStores);
  return <AppStateContext.Provider value={stores}>{children}</AppStateContext.Provider>;
}
