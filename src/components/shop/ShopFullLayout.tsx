import { Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { BikeFitmentBar } from "@/components/shop/BikeFitmentBar";
import { Media, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import type { Bike } from "@/types";

interface ShopFullLayoutProps {
  bikes: Bike[];
}

/**
 * Full public Shop layout implementation. Preserved here so it can be restored
 * cleanly when Coming Soon mode is removed.
 */
export function ShopFullLayout({ bikes }: ShopFullLayoutProps) {
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
