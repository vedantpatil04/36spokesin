import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { CartSummary } from "@/components/member/CartSummary";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { OrderList } from "@/components/member/OrderList";
import { WishlistGrid } from "@/components/member/WishlistGrid";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listOrders } from "@/services/commerce";
import { useAuthUser } from "@/state/auth";
import { usePrimaryBike } from "@/state/garage";

export const Route = createFileRoute("/my-36-spokes/shop")({
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
  const primaryBike = usePrimaryBike();
  const user = useAuthUser();
  const orders = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: listOrders,
    enabled: Boolean(user),
  });

  return (
    <div>
      <MemberPageTitle
        title="My shop"
        description="Your cart, the gear you've saved, and your orders."
      />
      <div className="space-y-4">
        <MemberPanel title="Cart" headingLevel="h3">
          <CartSummary />
        </MemberPanel>

        <MemberPanel title="Wishlist" headingLevel="h3">
          <WishlistGrid {...(primaryBike ? { bikeId: primaryBike.bikeId } : {})} />
        </MemberPanel>

        <MemberPanel title="Orders" headingLevel="h3">
          {orders.isPending ? (
            <Skeleton className="mt-4 h-16 w-full" />
          ) : orders.isError ? (
            <ErrorState
              title="Your orders didn't load"
              onRetry={() => void orders.refetch()}
              className="mt-4"
            />
          ) : orders.data.length > 0 ? (
            <OrderList orders={orders.data} />
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
