import { Heart, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import { useCartActions, useCartQuantity } from "@/state/cart";
import { useIsWishlisted, useWishlistActions } from "@/state/wishlist";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const cart = useCartActions();
  const inCart = useCartQuantity(product.id);
  const wishlisted = useIsWishlisted(product.id);
  const wishlist = useWishlistActions();

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          onClick={() => cart.add(product.id)}
          disabled={!product.inStock}
        >
          <ShoppingBag className="size-4" aria-hidden />
          {product.inStock ? "Add to cart" : "Back in 2 weeks"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          aria-pressed={wishlisted}
          onClick={() => wishlist.toggle(product.id)}
        >
          <Heart className={cn("size-4", wishlisted && "fill-primary text-primary")} aria-hidden />
          {wishlisted ? "Saved" : "Save"}
        </Button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-muted-foreground">
        {inCart > 0 ? (
          <>
            {inCart} in your cart.{" "}
            <ButtonLink
              to="/my-36-spokes/shop"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-primary hover:underline"
            >
              View cart
            </ButtonLink>
          </>
        ) : null}
      </p>
    </div>
  );
}
