import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ButtonLink, Media, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { BikeCard, ProductCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { bikes, garageServices, media, products } from "@/data/content";

export const Route = createFileRoute("/garage")({
  head: () => ({
    meta: [
      { title: "Garage: Find Your Bike, Fitment & Services | 36 Spokes" },
      {
        name: "description",
        content:
          "Pick your motorcycle and get compatible parts, maintenance guidance, installation and customization services.",
      },
      { property: "og:title", content: "Garage: Find Your Bike, Fitment & Services | 36 Spokes" },
      { property: "og:description", content: "Your bike. Your setup. Your garage." },
    ],
  }),
  component: GaragePage,
});

function GaragePage() {
  const [selected, setSelected] = useState(bikes[0]!);

  return (
    <>
      <PageHeader
        eyebrow="Garage"
        title="Your bike. Your setup. Your garage."
        description="Start with your motorcycle and everything else — parts, fitment, servicing, trip prep — lines up behind it."
        image={media.garageWorkshop}
        imageAlt="Motorcycle workshop with a mechanic working on an adventure bike"
      />

      <Section>
        <SectionHeader eyebrow="Find your bike" title="Brand · Model · Variant" />
        <Rail className="mt-10 md:grid-cols-3 lg:grid-cols-6">
          {bikes.map((bike) => (
            <RailItem key={bike.id}>
              <BikeCard bike={bike} selected={bike.id === selected.id} onSelect={setSelected} />
            </RailItem>
          ))}
        </Rail>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow={`${selected.brand} ${selected.model}`}
          title="Recommended for this motorcycle"
          action={
            <ButtonLink to="/shop" variant="outline">
              See all gear
            </ButtonLink>
          }
        />
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {products
            .filter((p) => p.fitsSelectedBike)
            .slice(0, 4)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeader eyebrow="Services" title="Work done properly" />
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {garageServices.map((service) => (
                <li key={service.name} className="py-4">
                  <p className="font-display text-sm uppercase tracking-[0.16em]">{service.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{service.note}</p>
                </li>
              ))}
            </ul>
          </div>
          <Media
            src={media.garageWorkshop}
            alt="Accessories being fitted to a motorcycle in a workshop"
            ratio="3/2"
            className="rounded-sm border border-border"
          />
        </div>
      </Section>
    </>
  );
}
