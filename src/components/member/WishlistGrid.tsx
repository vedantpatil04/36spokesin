import { Heart, X } from "lucide-react";
import { EmptyState, Skeleton } from "@/components/states";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ButtonLink } from "@/components/ui-kit";
import { useAccountAction } from "@/hooks/use-account-action";
import { useWishlistActions, useWishlistItems, useWishlistStatus } from "@/state/wishlist";
import type { ID } from "@/types";

/** The rider's saved products, from the API. Products no longer sold are listed separately. */
export function WishlistGrid({ bikeId }: { bikeId?: ID }) {
  const items = useWishlistItems();
  const status = useWishlistStatus();
  const wishlist = useWishlistActions();
  const action = useAccountAction();

  if (status === "loading" && items.length === 0) {
    return <Skeleton className="mt-4 h-40 w-full" />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Save gear from any product page to compare it later."
        action={
          <ButtonLink to="/shop" variant="outline">
            Find gear to save
          </ButtonLink>
        }
        className="mt-4"
      />
    );
  }

  const available = items.filter((item) => item.available).map((item) => item.product);
  const gone = items.filter((item) => !item.available);

  return (
    <div className="mt-4 space-y-4">
      {available.length > 0 ? (
        <ProductGrid
          products={available}
          {...(bikeId !== undefined ? { bikeId } : {})}
          className="lg:grid-cols-3"
        />
      ) : null}
      {gone.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground">No longer in the shop:</p>
          <ul className="mt-2 divide-y divide-border rounded-sm border border-border">
            {gone.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span>{item.product.name}</span>
                <button
                  type="button"
                  onClick={() => void action.run(() => wishlist.remove(item.id))}
                  disabled={action.pending}
                  className="flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${item.product.name} from your wishlist`}
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-sm text-destructive">
          {action.error}
        </p>
      ) : null}
    </div>
  );
}
