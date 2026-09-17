import type { ReactNode } from "react";

/** Lays out two or more header actions side by side. */
export function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
}
