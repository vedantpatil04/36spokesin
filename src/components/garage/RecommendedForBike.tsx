import { useQuery } from "@tanstack/react-query";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CardGridSkeleton, ErrorState } from "@/components/states";
import { listProductsForBike } from "@/services/catalog";
import type { ID } from "@/types";

/** Products confirmed to fit a bike, fetched from the API for whichever bike is chosen. */
export function RecommendedForBike({
  bikeId,
  limit = 4,
  className,
}: {
  bikeId: ID;
  limit?: number;
  className?: string;
}) {
  const query = useQuery({
    queryKey: ["products", "for-bike", bikeId, limit],
    queryFn: () => listProductsForBike(bikeId, limit),
  });

  const classProps = className ? { className } : {};
  if (query.isPending) return <CardGridSkeleton count={limit} {...classProps} />;
  if (query.isError) {
    return (
      <ErrorState
        title="Recommendations didn't load"
        description="Check your connection and try again."
        onRetry={() => void query.refetch()}
        {...classProps}
      />
    );
  }
  return (
    <ProductGrid
      products={query.data}
      bikeId={bikeId}
      {...classProps}
      emptyTitle="No confirmed fitment yet"
      emptyDescription="We haven't confirmed bike-mounted parts for this model. Rider gear in the shop fits every bike."
    />
  );
}
