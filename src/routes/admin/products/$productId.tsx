import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Archive, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductMediaManager } from "@/components/admin/ProductMediaManager";
import { AdminPageHeader, InlineError, ProductStatusBadge } from "@/components/admin/admin-ui";
import { productToValues } from "@/components/admin/product-form-model";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui-kit";
import { ApiError } from "@/lib/api";
import { listAdminBikes } from "@/services/admin/bikes";
import {
  archiveProduct,
  duplicateProduct,
  getAdminProduct,
  listAdminCategories,
  listBrands,
  updateProduct,
} from "@/services/admin/catalog";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/products/$productId")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const refresh = useCatalogRefresh();
  const product = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => getAdminProduct(productId),
    // The form owns its edits; don't overwrite them by refetching in the background.
    refetchOnWindowFocus: false,
  });
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: listAdminCategories });
  const brands = useQuery({ queryKey: ["admin", "brands"], queryFn: listBrands });
  const bikes = useQuery({ queryKey: ["admin", "bikes"], queryFn: listAdminBikes });
  const [imageCount, setImageCount] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (product.isError && product.error instanceof ApiError && product.error.status === 404) {
    return (
      <EmptyState
        title="Product not found"
        description="It may have been removed, or the link is wrong."
        action={
          <ButtonLink to="/admin/products" variant="outline">
            Back to products
          </ButtonLink>
        }
      />
    );
  }
  if (product.isPending || categories.isPending || brands.isPending || bikes.isPending) {
    return <PageSkeleton layout="detail" />;
  }
  if (product.isError || categories.isError || brands.isError || bikes.isError) {
    return <ErrorState title="The editor didn't load" onRetry={() => void product.refetch()} />;
  }

  const data = product.data;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(describeError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Products"
        title={data.name}
        description={`SKU ${data.sku}`}
        actions={
          <>
            <ProductStatusBadge status={data.status} />
            {data.status === "PUBLISHED" ? (
              <ButtonLink
                to="/product/$slug"
                params={{ slug: data.slug }}
                variant="outline"
                size="sm"
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                View in shop
              </ButtonLink>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const copy = await duplicateProduct(data.id);
                  await refresh(["admin", "products"]);
                  await navigate({
                    to: "/admin/products/$productId",
                    params: { productId: copy.id },
                  });
                })
              }
            >
              <Copy className="size-3.5" aria-hidden />
              Duplicate
            </Button>
            {data.status !== "ARCHIVED" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (
                    !window.confirm(
                      `Archive “${data.name}”? It leaves the shop but keeps its history.`,
                    )
                  )
                    return;
                  void run(async () => {
                    await archiveProduct(data.id);
                    await refresh(["admin", "products"], ["admin", "product", productId]);
                    await navigate({ to: "/admin/products" });
                  });
                }}
              >
                <Archive className="size-3.5" aria-hidden />
                Archive
              </Button>
            ) : null}
          </>
        }
      />
      <InlineError message={actionError} />

      <ProductForm
        key={data.id}
        isNew={false}
        initialValues={productToValues(data)}
        categories={categories.data}
        brands={brands.data}
        bikes={bikes.data}
        imageCount={imageCount ?? data.images.length}
        mediaSlot={
          <ProductMediaManager
            productId={data.id}
            productName={data.name}
            initialImages={data.images}
            onChange={(images) => {
              setImageCount(images.length);
              void refresh(["admin", "products"]);
            }}
          />
        }
        submitLabel="Save changes"
        onSubmit={async (input) => {
          const saved = await updateProduct(data.id, input);
          queryClient.setQueryData(["admin", "product", productId], saved);
          await refresh(["admin", "products"]);
          return productToValues(saved);
        }}
      />
    </div>
  );
}
