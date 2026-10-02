import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { EmptyState, Skeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { useAccountAction } from "@/hooks/use-account-action";
import { formatINR } from "@/lib/format";
import { MAX_CART_QUANTITY, useCart, useCartActions, useCartStatus } from "@/state/cart";
import type { CartLineIssue } from "@/types";

const iconButton =
  "flex size-9 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const ISSUE_TEXT: Record<CartLineIssue, string> = {
  not_available: "No longer sold. Remove it to continue.",
  out_of_stock: "Out of stock right now.",
  insufficient_stock: "Fewer in stock than you've added. Lower the quantity.",
};

/** The rider's server-side cart. Prices and availability come from the API on every change. */
export function CartSummary() {
  const cart = useCart();
  const status = useCartStatus();
  const actions = useCartActions();
  const action = useAccountAction();

  if (status === "loading" && !cart) {
    return (
      <div className="mt-4 space-y-3" aria-busy="true">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (status === "error" && !cart) {
    return (
      <p role="alert" className="mt-4 text-sm text-destructive">
        Your cart didn't load.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void action.run(actions.refresh)}
        >
          Try again
        </button>
      </p>
    );
  }

  if (!cart || cart.lines.length === 0) {
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
    <div className="mt-4" aria-busy={action.pending}>
      <ul className="divide-y divide-border">
        {cart.lines.map((line) => {
          const max = Math.min(MAX_CART_QUANTITY, Math.max(line.product.maxOrderQuantity, 1));
          return (
            <li key={line.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
              <div className="min-w-0 flex-1">
                <Link
                  to="/product/$slug"
                  params={{ slug: line.product.slug }}
                  className="text-sm font-semibold hover:text-primary"
                >
                  {line.product.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatINR(line.unitPrice)} each
                </p>
                {line.issue ? (
                  <p className="mt-1 text-xs text-warning">{ISSUE_TEXT[line.issue]}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={iconButton}
                  onClick={() =>
                    void action.run(() => actions.setQuantity(line.id, line.quantity - 1))
                  }
                  disabled={line.quantity <= 1 || action.pending || line.issue === "not_available"}
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
                  onClick={() =>
                    void action.run(() => actions.setQuantity(line.id, line.quantity + 1))
                  }
                  disabled={line.quantity >= max || action.pending || line.issue !== null}
                  aria-label={`Increase quantity of ${line.product.name}`}
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => void action.run(() => actions.remove(line.id))}
                  disabled={action.pending}
                  aria-label={`Remove ${line.product.name} from cart`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {action.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {action.error}
        </p>
      ) : null}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="font-display text-xl">{formatINR(cart.subtotal)}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Your cart is saved to your account. Checkout opens when payments launch.
      </p>
    </div>
  );
}
