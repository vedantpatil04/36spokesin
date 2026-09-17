import { Heart } from "lucide-react";
import { ButtonLink } from "@/components/ui-kit";
import { EmptyState } from "@/components/states";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { useWishlistItems } from "@/state/wishlist";
import type { ID, Product } from "@/types";

export function WishlistGrid({ products, bikeId }: { products: Product[]; bikeId?: ID }) {
  const items = useWishlistItems();
  const saved = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [product] : [];
  });

  if (saved.length === 0) {
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
  return (
    <ProductGrid
      products={saved}
      {...(bikeId !== undefined ? { bikeId } : {})}
      className="mt-4 lg:grid-cols-3"
    />
  );
}
