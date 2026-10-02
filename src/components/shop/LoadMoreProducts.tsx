import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Button } from "@/components/ui-kit";
import { describeError } from "@/services/request-helpers";
import { listProductPage, type ProductFilter } from "@/services/catalog";
import type { Product, ProductPage } from "@/types";
import type { ComponentProps } from "react";

/**
 * A product grid seeded by the route loader, with a "Show more" button that
 * fetches the next page from the API. Resets when the loader data changes.
 */
export function LoadMoreProducts({
  initial,
  filter,
  ...gridProps
}: { initial: ProductPage; filter: ProductFilter } & Omit<
  ComponentProps<typeof ProductGrid>,
  "products"
>) {
  const [products, setProducts] = useState<Product[]>(initial.products);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProducts(initial.products);
    setCursor(initial.nextCursor);
    setError(null);
  }, [initial]);

  const loadMore = () => {
    if (!cursor) return;
    setLoading(true);
    setError(null);
    listProductPage({ ...filter, cursor })
      .then((page) => {
        setProducts((current) => [...current, ...page.products]);
        setCursor(page.nextCursor);
      })
      .catch((caught: unknown) => setError(describeError(caught)))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <ProductGrid products={products} {...gridProps} />
      {cursor ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Show more gear
          </Button>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
