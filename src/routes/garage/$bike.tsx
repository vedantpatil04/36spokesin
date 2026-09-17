import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { EntityNotFound, PageSkeleton } from "@/components/states";
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
import { seo } from "@/lib/seo";
import { getBikeBySlug, listProductsForBike } from "@/services/catalog";
import { useSelectBike, useSelectedBikeId } from "@/state/garage";

export const Route = createFileRoute("/garage/$bike")({
  loader: async ({ params }) => {
    const bike = await getBikeBySlug(params.bike);
    if (!bike) throw notFound();
    const products = await listProductsForBike(bike.id);
    return { bike, products };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.bike.brand} ${loaderData.bike.model}: Gear, Fitment & Specs | 36 Spokes`,
          description: `Gear confirmed to fit the ${loaderData.bike.brand} ${loaderData.bike.model}, with tank range and variants.`,
          path: `/garage/${loaderData.bike.slug}`,
          image: loaderData.bike.image,
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="motorcycle" backTo="/garage" backLabel="Back to the garage" />
  ),
  component: BikePage,
});

function BikePage() {
  const { bike, products } = Route.useLoaderData();
  const selectedBikeId = useSelectedBikeId();
  const selectBike = useSelectBike();
  const isSelected = selectedBikeId === bike.id;
  const name = `${bike.brand} ${bike.model}`;
  const rangeKm = Math.round(bike.tankLitres * bike.fuelEfficiencyKmpl);

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
                { label: "Tank", value: `${bike.tankLitres} L` },
                { label: "Economy", value: `~${bike.fuelEfficiencyKmpl} km/l` },
                { label: "Range per tank", value: `~${rangeKm} km` },
              ]}
            />
            <h3 className="mt-10 text-xl">Variants</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {bike.variants.map((variant) => (
                <li key={variant.id}>
                  <Badge>{variant.name}</Badge>
                </li>
              ))}
            </ul>
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
