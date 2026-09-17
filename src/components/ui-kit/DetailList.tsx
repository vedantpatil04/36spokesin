import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DetailItem = { label: string; value: ReactNode };

/** Label/value pairs in a grid, e.g. trip duration, distance, start. */
export function DetailList({
  items,
  className,
  size = "sm",
}: {
  items: DetailItem[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <dl
      className={cn(
        size === "sm"
          ? "grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground"
          : "grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt
            className={cn(
              "uppercase",
              size === "sm"
                ? "tracking-[0.16em] text-[0.6rem]"
                : "text-[0.65rem] tracking-[0.2em] text-muted-foreground",
            )}
          >
            {item.label}
          </dt>
          <dd
            className={cn(
              "text-foreground",
              size === "md" && "mt-1.5 font-display text-xl uppercase",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
