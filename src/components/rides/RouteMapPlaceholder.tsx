import { cn } from "@/lib/utils";

/** Reserved space for the map-based route builder (Phase 4). */
export function RouteMapPlaceholder({
  className,
  label = "Map experience reserved for a later phase",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-64 items-center justify-center rounded-sm border border-dashed border-border-strong bg-surface-2 px-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {label}
    </div>
  );
}
