import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Check, TriangleAlert } from "lucide-react";
import { ProductActions } from "@/components/shop/ProductActions";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { Media, Section, SectionHeader } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getProductBySlug, listBikes, listRelatedProducts } from "@/services/catalog";
import { useProductFits, useSelectedBikeId } from "@/state/garage";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug(params.slug);
    if (!product) throw notFound();
    const [related, bikes] = await Promise.all([listRelatedProducts(product), listBikes()]);
    return { product, related, bikes };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.product.name} | 36 Spokes Shop`,
          description: loaderData.product.summary,
          path: `/product/${loaderData.product.slug}`,
          image: loaderData.product.image,
          type: "product",
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="product" backTo="/shop" backLabel="Back to the shop" />
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related, bikes } = Route.useLoaderData();
  const fits = useProductFits(product);
  const selectedBikeId = useSelectedBikeId();
  const selectedBike = bikes.find((bike) => bike.id === selectedBikeId);
  const { fitment } = product;
  const confirmedBikes =
    fitment.kind === "bikes" ? bikes.filter((bike) => fitment.bikeIds.includes(bike.id)) : [];

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
          <Media
            asset={product.image}
            alt={product.name}
            ratio="1/1"
            className="rounded-sm border border-border"
            priority
          />
          <div>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="mt-3 text-4xl leading-[1.02] sm:text-5xl">{product.name}</h1>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden>★</span>
              <span>
                <span className="sr-only">Rated </span>
                {product.rating.toFixed(1)} from {product.reviews} reviews
              </span>
              <span aria-hidden>·</span>
              <span>{product.inStock ? "In stock" : "Back in 2 weeks"}</span>
            </p>
            <p className="mt-6 font-display text-3xl">{formatINR(product.price)}</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              {product.summary}
            </p>

            <section
              aria-labelledby="fitment-heading"
              className="mt-8 rounded-sm border border-border bg-surface p-4"
            >
              <h2 id="fitment-heading" className="sr-only">
                Fitment
              </h2>
              <p
                className={`flex items-center gap-2 text-sm ${fits ? "text-success" : "text-warning"}`}
              >
                {fits ? (
                  <Check className="size-4 shrink-0" aria-hidden />
                ) : (
                  <TriangleAlert className="size-4 shrink-0" aria-hidden />
                )}
                {fits
                  ? `Fits your ${selectedBike?.model ?? "bike"}`
                  : `Not confirmed for your ${selectedBike?.model ?? "bike"}`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {fitment.kind === "universal"
                  ? "Rider gear. Fits any motorcycle."
                  : `Confirmed for ${confirmedBikes.map((bike) => `${bike.brand} ${bike.model}`).join(", ")}.`}{" "}
                <Link to="/garage" className="text-primary hover:underline">
                  Change bike
                </Link>
              </p>
            </section>

            <div className="mt-8">
              <ProductActions product={product} />
            </div>
          </div>
        </article>
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
