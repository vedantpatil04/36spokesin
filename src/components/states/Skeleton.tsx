import { cn } from "@/lib/utils";

/** A placeholder block. Motion is neutralised by the global reduced-motion rule. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-surface-2", className)} />;
}

export function CardSkeleton({ mediaRatio = "4/3" }: { mediaRatio?: string }) {
  return (
    <div aria-hidden className="overflow-hidden rounded-sm border border-border bg-card">
      <div className="animate-pulse bg-surface-2" style={{ aspectRatio: mediaRatio }} />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
  mediaRatio,
}: {
  count?: number;
  className?: string;
  mediaRatio?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} {...(mediaRatio ? { mediaRatio } : {})} />
      ))}
    </div>
  );
}

/**
 * Route-level loading UI shaped like a pillar page: header band, then content.
 * `layout="detail"` swaps the grid for a media + text split.
 */
export function PageSkeleton({ layout = "grid" }: { layout?: "grid" | "detail" }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="border-b border-border">
        <div className="container-page space-y-5 py-16 md:py-24">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      </div>
      <div className="container-page py-16 md:py-24">
        {layout === "grid" ? (
          <CardGridSkeleton />
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-11 w-40" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
