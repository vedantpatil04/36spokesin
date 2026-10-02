import { Heart, LoaderCircle, ShoppingBag } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui-kit";
import { useAccountAction } from "@/hooks/use-account-action";
import { cn } from "@/lib/utils";
import { useAuthStatus } from "@/state/auth";
import { useCartActions, useCartQuantity } from "@/state/cart";
import { useIsWishlisted, useWishlistActions } from "@/state/wishlist";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const cart = useCartActions();
  const wishlist = useWishlistActions();
  const inCart = useCartQuantity(product.id);
  const wishlisted = useIsWishlisted(product.id);
  const signedIn = useAuthStatus() === "authenticated";
  const cartAction = useAccountAction();
  const saveAction = useAccountAction();
  const atLimit = inCart >= product.maxOrderQuantity;
  const error = cartAction.error ?? saveAction.error;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="sm:flex-1"
          onClick={() => void cartAction.run(() => cart.add(product.id))}
          disabled={!product.inStock || cartAction.pending || (signedIn && atLimit)}
        >
          {cartAction.pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <ShoppingBag className="size-4" aria-hidden />
          )}
          {!product.inStock
            ? "Out of stock"
            : signedIn && atLimit
              ? "Cart limit reached"
              : "Add to cart"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          aria-pressed={wishlisted}
          disabled={saveAction.pending}
          onClick={() => void saveAction.run(() => wishlist.toggle(product.id))}
        >
          <Heart className={cn("size-4", wishlisted && "fill-primary text-primary")} aria-hidden />
          {wishlisted ? "Saved" : "Save"}
        </Button>
      </div>
      <p role="status" className="mt-3 min-h-5 text-sm text-muted-foreground">
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : inCart > 0 ? (
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
        ) : !signedIn ? (
          "Log in to add gear to your cart or wishlist."
        ) : null}
      </p>
    </div>
  );
}
