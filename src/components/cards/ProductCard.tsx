import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Badge, Button, Media } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
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

  return (
    <article className={cn(cardBase, stretchedCardFocus)}>
      <Media
        asset={product.image}
        alt={product.name}
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden>★</span>
          <span>
            <span className="sr-only">Rated </span>
            {product.rating.toFixed(1)} ({product.reviews}
            <span className="sr-only"> reviews</span>)
          </span>
          <span aria-hidden>·</span>
          <span>{product.inStock ? "In stock" : "Back in 2 weeks"}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className="font-display text-lg">{formatINR(product.price)}</span>
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
          disabled={!product.inStock}
          onClick={() => cart.add(product.id)}
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          {product.inStock ? "Add to cart" : "Back in 2 weeks"}
        </Button>
      </div>
    </article>
  );
}
