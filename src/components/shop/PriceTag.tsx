import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

/** Price with the compare-at price struck through when there is a saving. */
export function PriceTag({
  product,
  className,
  size = "md",
}: {
  product: Pick<Product, "price" | "compareAtPrice">;
  className?: string;
  size?: "md" | "lg";
}) {
  const saving = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2.5", className)}>
      <span className={cn("font-display", size === "lg" ? "text-3xl" : "text-lg")}>
        {formatINR(product.price)}
      </span>
      {saving ? (
        <span
          className={cn(
            "text-muted-foreground line-through",
            size === "lg" ? "text-base" : "text-xs",
          )}
        >
          <span className="sr-only">Was </span>
          {formatINR(product.compareAtPrice!)}
        </span>
      ) : null}
    </p>
  );
}
