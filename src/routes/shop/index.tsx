import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CardGridSkeleton } from "@/components/states";
import { seo } from "@/lib/seo";
import { listProducts } from "@/services/catalog";

const shopRoute = getRouteApi("/shop");

export const Route = createFileRoute("/shop/")({
  loader: async () => ({ products: await listProducts() }),
  head: () =>
    seo({
      title: "Motorcycle Gear & Accessories by Bike | 36 Spokes",
      description:
        "Luggage, protection, lighting and navigation gear, filtered by purpose and matched to your motorcycle model.",
      socialDescription: "Gear grouped by what it does on a ride, with fitment per model.",
      path: "/shop",
    }),
  pendingComponent: () => (
    <CardGridSkeleton className="mt-8 grid-cols-2 lg:grid-cols-4" count={4} />
  ),
  component: ShopIndex,
});

function ShopIndex() {
  const { products } = Route.useLoaderData();
  const { categories } = shopRoute.useLoaderData();

  return (
    <>
      <CategoryFilter categories={categories} activeSlug={null} />
      <ProductGrid products={products} className="mt-8" />
    </>
  );
}
