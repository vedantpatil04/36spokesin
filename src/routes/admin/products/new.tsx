import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
import { emptyProductValues } from "@/components/admin/product-form-model";
import { useCatalogRefresh } from "@/components/admin/use-admin";
import { ErrorState, PageSkeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { createProduct, listAdminCategories, listBrands } from "@/services/admin/catalog";
import { listAdminBikes } from "@/services/admin/bikes";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const refresh = useCatalogRefresh();
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: listAdminCategories });
  const brands = useQuery({ queryKey: ["admin", "brands"], queryFn: listBrands });
  const bikes = useQuery({ queryKey: ["admin", "bikes"], queryFn: listAdminBikes });

  if (categories.isPending || brands.isPending || bikes.isPending)
    return <PageSkeleton layout="detail" />;
  if (categories.isError || brands.isError || bikes.isError) {
    return (
      <ErrorState
        title="The editor didn't load"
        onRetry={() => {
          void categories.refetch();
          void brands.refetch();
          void bikes.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Products"
        title="New product"
        description="Save the details first; you can add photos straight after."
        actions={
          <ButtonLink to="/admin/products" variant="outline">
            Cancel
          </ButtonLink>
        }
      />
      {categories.data.length === 0 ? (
        <AdminPanel title="Add a category first">
          <p className="text-sm text-muted-foreground">Every product belongs to a category.</p>
          <ButtonLink to="/admin/categories" variant="outline" className="mt-4">
            Manage categories
          </ButtonLink>
        </AdminPanel>
      ) : (
        <ProductForm
          isNew
          initialValues={emptyProductValues()}
          categories={categories.data}
          brands={brands.data}
          bikes={bikes.data}
          imageCount={null}
          mediaSlot={
            <AdminPanel title="Media" description="Available once the product is saved.">
              <p className="text-sm text-muted-foreground">
                Save the product, then upload, order and caption its photos here.
              </p>
            </AdminPanel>
          }
          submitLabel="Create product"
          onSubmit={async (input) => {
            const product = await createProduct(input);
            await refresh(["admin", "products"]);
            await navigate({
              to: "/admin/products/$productId",
              params: { productId: product.id },
              hash: "product-media",
            });
          }}
        />
      )}
    </div>
  );
}
