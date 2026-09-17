import { Outlet, createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { BikeFitmentBar } from "@/components/shop/BikeFitmentBar";
import { PageSkeleton } from "@/components/states";
import { Media, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { listBikes, listProductCategories } from "@/services/catalog";

/**
 * Shop layout. The header, bike selector and storytelling persist while the
 * child route (/shop or /shop/$category) swaps the category chips and grid,
 * so changing category never resets the selected bike or scroll position.
 * Metadata is set by the child routes.
 */
export const Route = createFileRoute("/shop")({
  loader: async () => {
    const [bikes, categories] = await Promise.all([listBikes(), listProductCategories()]);
    return { bikes, categories };
  },
  pendingComponent: () => <PageSkeleton />,
  component: ShopLayout,
});

function ShopLayout() {
  const { bikes } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Gear up for the road"
        description="Purpose-built categories, fitment by motorcycle variant, and products shown as they look installed."
        image={media.products.protect}
      />

      <Section>
        <BikeFitmentBar bikes={bikes} />
        <Outlet />
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Category storytelling" title="Carry systems, on the bike" />
        <article className="mt-8 overflow-hidden rounded-sm border border-border">
          <Media asset={media.products.luggage} ratio="16/9">
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 md:p-12">
              <h3 className="text-2xl md:text-3xl">Pack once. Ride for eleven days.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Pannier sets, racks and tail bags listed by capacity, mounting type and the variants
                they fit.
              </p>
            </div>
          </Media>
        </article>
      </Section>
    </>
  );
}
