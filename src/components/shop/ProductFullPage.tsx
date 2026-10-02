import { Link } from "@tanstack/react-router";
import { Check, TriangleAlert } from "lucide-react";
import { PriceTag } from "@/components/shop/PriceTag";
import { ProductActions } from "@/components/shop/ProductActions";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Section, SectionHeader } from "@/components/ui-kit";
import { availabilityLabel } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { useProductFits, useSelectedBikeId } from "@/state/garage";
import type { Bike, Product, ProductSpecification } from "@/types";

function groupSpecifications(rows: ProductSpecification[]) {
  const groups: { name: string | null; rows: ProductSpecification[] }[] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last && last.name === row.group) last.rows.push(row);
    else groups.push({ name: row.group, rows: [row] });
  }
  return groups;
}

interface ProductFullPageProps {
  product: Product;
  related: Product[];
  bikes: Bike[];
}

/**
 * Full public Product detail page implementation. Preserved here so it can be restored
 * cleanly when Coming Soon mode is removed.
 */
export function ProductFullPage({ product, related, bikes }: ProductFullPageProps) {
  const fits = useProductFits(product);
  const selectedBikeId = useSelectedBikeId();
  const selectedBike = bikes.find((bike) => bike.id === selectedBikeId) ?? null;
  const universal = product.fitment.kind === "universal";

  return (
    <>
      <div className="container-page py-10 md:py-14">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                Shop
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                to="/shop/$category"
                params={{ category: product.category.slug }}
                className="hover:text-foreground"
              >
                {product.category.name}
              </Link>
            </li>
          </ol>
        </nav>

        <article className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ProductGallery
            images={product.images}
            fallback={product.image}
            productName={product.name}
          />
          <div>
            <p className="eyebrow">{product.brand?.name ?? product.category.name}</p>
            <h1 className="mt-3 text-4xl leading-[1.02] sm:text-5xl">{product.name}</h1>
            <p
              className={cn(
                "mt-4 text-sm",
                product.inStock ? "text-muted-foreground" : "text-warning",
              )}
            >
              {availabilityLabel(product)}
            </p>
            <PriceTag product={product} size="lg" className="mt-6" />
            {product.summary ? (
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {product.summary}
              </p>
            ) : null}

            <section
              aria-labelledby="fitment-heading"
              className="mt-8 rounded-sm border border-border bg-surface p-4"
            >
              <h2 id="fitment-heading" className="sr-only">
                Fitment
              </h2>
              {universal || selectedBike ? (
                <p
                  className={`flex items-center gap-2 text-sm ${fits ? "text-success" : "text-warning"}`}
                >
                  {fits ? (
                    <Check className="size-4 shrink-0" aria-hidden />
                  ) : (
                    <TriangleAlert className="size-4 shrink-0" aria-hidden />
                  )}
                  {universal
                    ? "Fits any motorcycle"
                    : fits
                      ? `Fits your ${selectedBike?.model}`
                      : `Not confirmed for your ${selectedBike?.model}`}
                </p>
              ) : null}
              <p
                className={cn(
                  "text-xs text-muted-foreground",
                  (universal || selectedBike) && "mt-2",
                )}
              >
                {universal
                  ? "Rider gear, not bike-specific."
                  : product.compatibility.length > 0
                    ? `Confirmed for ${product.compatibility
                        .map((fit) =>
                          fit.variantName ? `${fit.name} (${fit.variantName})` : fit.name,
                        )
                        .join(", ")}.`
                    : "Fitment hasn't been confirmed for any motorcycle yet."}{" "}
                <Link to="/garage" className="text-primary hover:underline">
                  {selectedBike ? "Change bike" : "Choose your bike"}
                </Link>
              </p>
            </section>

            <div className="mt-8">
              <ProductActions product={product} />
            </div>
          </div>
        </article>

        {product.description || product.specifications.length > 0 ? (
          <div className="mt-14 grid gap-10 border-t border-border pt-10 lg:grid-cols-2 lg:gap-14">
            {product.description ? (
              <section aria-labelledby="description-heading">
                <h2 id="description-heading" className="text-2xl">
                  About this gear
                </h2>
                <div className="mt-4 max-w-prose space-y-4 text-base leading-relaxed text-muted-foreground">
                  {product.description.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {product.specifications.length > 0 ? (
              <section aria-labelledby="specs-heading">
                <h2 id="specs-heading" className="text-2xl">
                  Specifications
                </h2>
                {groupSpecifications(product.specifications).map((group, index) => (
                  <div key={`${group.name ?? "general"}-${index}`} className="mt-5">
                    {group.name ? (
                      <h3 className="font-display text-sm uppercase tracking-[0.16em] text-muted-foreground">
                        {group.name}
                      </h3>
                    ) : null}
                    <dl className="mt-2 divide-y divide-border border-y border-border">
                      {group.rows.map((row) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-3 text-sm"
                        >
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className="text-foreground">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
                {product.weightGrams ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Shipping weight {(product.weightGrams / 1000).toLocaleString("en-IN")} kg
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      {related.length > 0 ? (
        <Section tone="surface">
          <SectionHeader eyebrow={product.category.name} title="More in this category" />
          <ProductGrid products={related} className="mt-10" />
        </Section>
      ) : null}
    </>
  );
}
