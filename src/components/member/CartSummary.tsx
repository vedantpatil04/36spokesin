import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { ButtonLink } from "@/components/ui-kit";
import { EmptyState } from "@/components/states";
import { formatINR } from "@/lib/format";
import { MAX_CART_QUANTITY, useCartActions, useCartItems } from "@/state/cart";
import type { Product } from "@/types";

const iconButton =
  "flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

/** The visitor's cart, from client state joined with catalogue products. */
export function CartSummary({ products }: { products: Product[] }) {
  const items = useCartItems();
  const cart = useCartActions();

  const lines = items.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return product ? [{ ...item, product }] : [];
  });
  const subtotal = lines.reduce((total, line) => total + line.product.price * line.quantity, 0);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Gear you add from a product page appears here."
        action={
          <ButtonLink to="/shop" variant="outline">
            Browse gear
          </ButtonLink>
        }
        className="mt-4"
      />
    );
  }

  return (
    <div className="mt-4">
      <ul className="divide-y divide-border">
        {lines.map((line) => (
          <li key={line.productId} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
            <div className="min-w-0 flex-1">
              <Link
                to="/product/$slug"
                params={{ slug: line.product.slug }}
                className="text-sm font-semibold hover:text-primary"
              >
                {line.product.name}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatINR(line.product.price)} each
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={iconButton}
                onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                disabled={line.quantity <= 1}
                aria-label={`Decrease quantity of ${line.product.name}`}
              >
                <Minus className="size-3.5" aria-hidden />
              </button>
              <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
                <span className="sr-only">Quantity </span>
                {line.quantity}
              </span>
              <button
                type="button"
                className={iconButton}
                onClick={() => cart.setQuantity(line.productId, line.quantity + 1)}
                disabled={line.quantity >= MAX_CART_QUANTITY}
                aria-label={`Increase quantity of ${line.product.name}`}
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
              <button
                type="button"
                className={iconButton}
                onClick={() => cart.remove(line.productId)}
                aria-label={`Remove ${line.product.name} from cart`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="font-display text-xl">{formatINR(subtotal)}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Checkout isn't connected yet. Your cart is kept for this visit only.
      </p>
    </div>
  );
}
