import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CardGridSkeleton, EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { getProductCategory, listProducts } from "@/services/catalog";

const shopRoute = getRouteApi("/shop");

export const Route = createFileRoute("/shop/$category")({
  loader: async ({ params }) => {
    const category = await getProductCategory(params.category);
    if (!category) throw notFound();
    const products = await listProducts({ categorySlug: category.slug });
    return { category, products };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.category.name} Gear for Motorcycles | 36 Spokes Shop`,
          description: `${loaderData.category.purpose}, matched to your motorcycle model.`,
          path: `/shop/${loaderData.category.slug}`,
          image: loaderData.category.image,
        })
      : {},
  pendingComponent: () => (
    <CardGridSkeleton className="mt-8 grid-cols-2 lg:grid-cols-4" count={4} />
  ),
  notFoundComponent: () => (
    <EmptyState
      className="mt-8"
      title="That category doesn't exist"
      description="The link may be out of date. Every category is listed in the shop."
      action={
        <ButtonLink to="/shop" variant="outline">
          All gear
        </ButtonLink>
      }
    />
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category, products } = Route.useLoaderData();
  const { categories } = shopRoute.useLoaderData();

  return (
    <>
      <CategoryFilter categories={categories} activeSlug={category.slug} />
      <ProductGrid
        products={products}
        className="mt-8"
        emptyTitle={`No ${category.name.toLowerCase()} gear yet`}
        emptyDescription={`${category.purpose} are on the way. Browse the other categories in the meantime.`}
        emptyAction={
          <ButtonLink to="/shop" variant="outline">
            All gear
          </ButtonLink>
        }
      />
    </>
  );
}
