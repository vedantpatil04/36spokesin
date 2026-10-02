import { AddToGarageButton } from "@/components/garage/AddToGarageButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";
import {
  Badge,
  Button,
  ButtonLink,
  DetailList,
  Media,
  Section,
  SectionHeader,
} from "@/components/ui-kit";
import { media } from "@/data/media";
import { useSelectBike, useSelectedBikeId } from "@/state/garage";
import type { Bike, Product } from "@/types";

interface BikeFullPageProps {
  bike: Bike;
  products: Product[];
}

/**
 * Full public Bike detail page implementation. Preserved here so it can be restored
 * cleanly when Coming Soon mode is removed.
 */
export function BikeFullPage({ bike, products }: BikeFullPageProps) {
  const selectedBikeId = useSelectedBikeId();
  const selectBike = useSelectBike();
  const isSelected = selectedBikeId === bike.id;
  const name = `${bike.brand} ${bike.model}`;
  const rangeKm =
    bike.tankLitres !== null && bike.fuelEfficiencyKmpl !== null
      ? Math.round(bike.tankLitres * bike.fuelEfficiencyKmpl)
      : null;

  return (
    <>
      <PageHeader
        eyebrow={bike.brand}
        title={bike.model}
        description={`${bike.segment} motorcycle. Gear, fitment and journey plans on 36 Spokes are matched to this model.`}
        image={media.garage.workshop}
        imageAlt=""
      >
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => selectBike(bike.id)}
            aria-pressed={isSelected}
            disabled={isSelected}
          >
            {isSelected ? "This is your bike" : "Set as my bike"}
          </Button>
          <ButtonLink to="/shop" variant="outline" size="lg" onClick={() => selectBike(bike.id)}>
            Shop for this bike
          </ButtonLink>
          <AddToGarageButton bike={bike} />
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          <Media
            asset={bike.image}
            alt={name}
            ratio="4/3"
            className="rounded-sm border border-border"
          />
          <div>
            <SectionHeader eyebrow="Specification" title="At a glance" />
            <DetailList
              size="md"
              className="mt-8"
              items={[
                { label: "Segment", value: bike.segment },
                ...(bike.displacementCc
                  ? [{ label: "Engine", value: `${bike.displacementCc} cc` }]
                  : []),
                ...(bike.tankLitres !== null
                  ? [{ label: "Tank", value: `${bike.tankLitres} L` }]
                  : []),
                ...(bike.fuelEfficiencyKmpl !== null
                  ? [{ label: "Economy", value: `~${bike.fuelEfficiencyKmpl} km/l` }]
                  : []),
                ...(rangeKm !== null ? [{ label: "Range per tank", value: `~${rangeKm} km` }] : []),
              ]}
            />
            {bike.description ? (
              <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted-foreground">
                {bike.description}
              </p>
            ) : null}
            {bike.variants.length > 0 ? (
              <>
                <h3 className="mt-10 text-xl">Variants</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {bike.variants.map((variant) => (
                    <li key={variant.id}>
                      <Badge>{variant.name}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mt-6 text-xs text-muted-foreground">
              Figures are approximate and used for planning estimates.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow={name}
          title="Gear that fits"
          action={
            <ButtonLink to="/shop" variant="outline">
              See all gear
            </ButtonLink>
          }
        />
        <ProductGrid
          products={products}
          bikeId={bike.id}
          className="mt-10"
          emptyTitle="No confirmed fitment yet"
          emptyDescription="We haven't confirmed gear for this model yet. Rider gear in the shop fits every bike."
        />
      </Section>
    </>
  );
}
