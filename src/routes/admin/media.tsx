import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Images, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatBytes } from "@/components/admin/admin-format";
import { AdminPageHeader, Checkbox, InlineError } from "@/components/admin/admin-ui";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Badge, Button, SelectInput } from "@/components/ui-kit";
import type { ApiAdminMediaAsset, ApiMediaCategory } from "@/lib/api";
import { deleteMediaAsset, listMediaLibrary } from "@/services/admin/media";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/media")({
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  const refresh = useCatalogRefresh();
  const [category, setCategory] = useState<ApiMediaCategory | "">("");
  const [unused, setUnused] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const library = useInfiniteQuery({
    queryKey: ["admin", "media", category, unused],
    queryFn: ({ pageParam }) =>
      listMediaLibrary({ category: category || undefined, unused, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.meta.nextCursor,
  });

  const assets = library.data?.pages.flatMap((page) => page.items) ?? [];

  const remove = async (asset: ApiAdminMediaAsset) => {
    if (!window.confirm("Delete this file permanently from storage?")) return;
    setBusyId(asset.id);
    setError(null);
    try {
      await deleteMediaAsset(asset.id);
      await refresh(["admin", "media"]);
    } catch (caught) {
      setError(describeError(caught));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media library"
        description="Every catalogue and community image in storage and where it's used. Files still in use can't be deleted; unused ones (e.g. abandoned uploads) can be cleaned up here."
      />
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <SelectInput
          aria-label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ApiMediaCategory | "")}
          className="mt-0 h-11 w-full sm:w-56"
        >
          <option value="">Products, bikes and community</option>
          <option value="PRODUCT">Products</option>
          <option value="BIKE">Bikes</option>
          <option value="COMMUNITY">Founders and riders</option>
          <option value="STORY">Stories</option>
          <option value="GROUP">Groups</option>
        </SelectInput>
        <Checkbox
          id="media-unused"
          label="Only unused files"
          checked={unused}
          onChange={setUnused}
        />
      </div>
      <InlineError message={error} />

      {library.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="aspect-square w-full" />
          ))}
        </div>
      ) : library.isError ? (
        <ErrorState
          title="The media library didn't load"
          description={describeError(library.error)}
          onRetry={() => void library.refetch()}
        />
      ) : assets.length === 0 ? (
        <EmptyState
          icon={Images}
          title={unused ? "No unused files" : "No catalogue images yet"}
          description="Images uploaded for products, bikes and the community pages appear here."
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="overflow-hidden rounded-sm border border-border bg-card"
              >
                <div className="aspect-square bg-surface">
                  {asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.altText ?? ""}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <p className="flex size-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                      {asset.status === "PENDING" ? "Upload never finished" : "Preview unavailable"}
                    </p>
                  )}
                </div>
                <div className="space-y-2 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge>{asset.category.toLowerCase()}</Badge>
                    {asset.status !== "READY" ? (
                      <Badge tone="warning">{asset.status.toLowerCase()}</Badge>
                    ) : null}
                    {asset.usage.total === 0 ? <Badge tone="warning">unused</Badge> : null}
                  </div>
                  <p className="text-muted-foreground">
                    {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                    {formatBytes(asset.fileSize)} ·{" "}
                    {new Date(asset.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-foreground">{asset.usage.summary}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full min-h-10 text-xs"
                    disabled={asset.usage.total > 0 || busyId !== null}
                    onClick={() => void remove(asset)}
                    title={
                      asset.usage.total > 0
                        ? "Remove it from its products or bikes first"
                        : "Delete file"
                    }
                  >
                    {busyId === asset.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden />
                    )}
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {library.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto min-h-11 px-8"
                onClick={() => void library.fetchNextPage()}
                disabled={library.isFetchingNextPage}
              >
                {library.isFetchingNextPage ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : null}
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
