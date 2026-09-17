import { PackageSearch } from "lucide-react";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/cards";
import { EmptyState } from "@/components/states";
import { cn } from "@/lib/utils";
import type { ID, Product } from "@/types";

export function ProductGrid({
  products,
  bikeId,
  className,
  emptyTitle = "No products here yet",
  emptyDescription = "Try another category, or check back as the catalogue grows.",
  emptyAction,
}: {
  products: Product[];
  /** Fitment reference. Defaults to the visitor's selected bike. */
  bikeId?: ID;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          {...(bikeId !== undefined ? { bikeId } : {})}
        />
      ))}
    </div>
  );
}
