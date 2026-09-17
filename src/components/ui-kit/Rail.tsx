import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Horizontal swipe rail on small screens, grid on larger screens. */
export function Rail({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2",
        "md:mx-0 md:grid md:snap-none md:overflow-visible md:px-0 md:pb-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "w-[78vw] max-w-80 shrink-0 snap-start sm:w-[55vw] md:w-auto md:max-w-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
