import { Link } from "@tanstack/react-router";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { Badge, Button, Media } from "@/components/ui-kit";
import { PriceTag } from "@/components/shop/PriceTag";
import { useAccountAction } from "@/hooks/use-account-action";
import { availabilityLabel } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { useCartActions } from "@/state/cart";
import { useProductFits } from "@/state/garage";
import type { ID, Product } from "@/types";
import { cardBase, stretchedCardFocus, stretchedControl } from "./card-styles";

/**
 * Product tile linking to the product page. Fitment is shown for `bikeId`, or
 * the visitor's selected bike when omitted.
 */
export function ProductCard({ product, bikeId }: { product: Product; bikeId?: ID }) {
  const fits = useProductFits(product, bikeId);
  const cart = useCartActions();
  const action = useAccountAction();

  return (
    <article className={cn(cardBase, stretchedCardFocus)}>
      <Media
        asset={product.image}
        alt={product.hasImage ? product.name : ""}
        ratio="1/1"
        imgClassName="group-hover:scale-[1.04]"
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          {product.category.name}
        </p>
        <h3 className="text-base normal-case leading-snug font-sans font-semibold">
          <Link to="/product/$slug" params={{ slug: product.slug }} className={stretchedControl}>
            {product.name}
          </Link>
        </h3>
        <p className={cn("text-xs", product.inStock ? "text-muted-foreground" : "text-warning")}>
          {availabilityLabel(product)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <PriceTag product={product} />
          {fits ? (
            <Badge tone="success">
              <span>
                <span aria-hidden>✓ </span>Fits your bike
              </span>
            </Badge>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="relative z-10 mt-2 w-full"
          disabled={!product.inStock || action.pending}
          onClick={() => void action.run(() => cart.add(product.id))}
        >
          {action.pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ShoppingBag className="size-3.5" aria-hidden />
          )}
          {product.inStock ? "Add to cart" : "Out of stock"}
        </Button>
        {action.error ? (
          <p role="alert" className="relative z-10 text-xs text-destructive">
            {action.error}
          </p>
        ) : null}
      </div>
    </article>
  );
}
