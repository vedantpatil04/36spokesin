import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { CartSummary } from "@/components/member/CartSummary";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { OrderList } from "@/components/member/OrderList";
import { WishlistGrid } from "@/components/member/WishlistGrid";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listProducts } from "@/services/catalog";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/shop")({
  loader: async () => ({ products: await listProducts() }),
  head: () =>
    seo({
      title: "My Shop | My 36 Spokes",
      description: "Your cart, wishlist and orders.",
      path: "/my-36-spokes/shop",
      noIndex: true,
    }),
  component: MemberShopPage,
});

function MemberShopPage() {
  const { products } = Route.useLoaderData();
  const { orders, primaryBike } = memberRoute.useLoaderData();

  return (
    <div>
      <MemberPageTitle
        title="My shop"
        description="Your cart, the gear you've saved, and your orders."
      />
      <div className="space-y-4">
        <MemberPanel title="Cart" headingLevel="h3">
          <CartSummary products={products} />
        </MemberPanel>

        <MemberPanel title="Wishlist" headingLevel="h3">
          <WishlistGrid
            products={products}
            {...(primaryBike ? { bikeId: primaryBike.bikeId } : {})}
          />
        </MemberPanel>

        <MemberPanel title="Orders" headingLevel="h3">
          {orders.length > 0 ? (
            <OrderList orders={orders} />
          ) : (
            <EmptyState
              icon={Package}
              className="mt-4"
              title="No orders yet"
              description="Orders and their delivery status appear here once checkout opens."
              action={
                <ButtonLink to="/shop" variant="outline">
                  Browse gear
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>
      </div>
    </div>
  );
}
