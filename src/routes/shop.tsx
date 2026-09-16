import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Media, Section, SectionHeader } from "@/components/ui-kit";
import { ProductCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { bikes, media, products, shopCategories } from "@/data/content";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Motorcycle Gear & Accessories by Bike | 36 Spokes" },
      {
        name: "description",
        content:
          "Luggage, protection, lighting and navigation gear, filtered by purpose and matched to your motorcycle model.",
      },
      { property: "og:title", content: "Motorcycle Gear & Accessories by Bike | 36 Spokes" },
      { property: "og:description", content: "Gear grouped by what it does on a ride, with fitment per model." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [category, setCategory] = useState<string>("All");
  const [bikeId, setBikeId] = useState(bikes[0]!.id);
  const bike = bikes.find((b) => b.id === bikeId)!;

  const filtered = category === "All" ? products : products.filter((p) => p.category === category);
  const activeCategory = shopCategories.find((c) => c.name === category);

  return (
    <>
      <PageHeader
        eyebrow="Shop"
        title="Gear up for the road"
        description="Purpose-built categories, fitment by motorcycle variant, and products shown as they look installed."
        image={media.productProtect}
        imageAlt="Adventure helmet and armoured riding jacket"
      />

      <Section>
        <div className="flex flex-col gap-4 rounded-sm border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground md:flex-row md:items-center md:gap-3">
            Shop for
            <select
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              className="h-11 rounded-sm border border-input bg-background px-3 font-display text-sm uppercase tracking-[0.1em] text-foreground"
            >
              {bikes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.brand} {b.model}
                </option>
              ))}
            </select>
          </label>
          <Badge tone="success">✓ Fitment shown for {bike.model}</Badge>
        </div>

        <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
          {["All", ...shopCategories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              aria-pressed={category === name}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 font-display text-xs uppercase tracking-[0.16em] transition-colors",
                category === name
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {activeCategory
            ? `${activeCategory.name}: ${activeCategory.purpose}.`
            : "Categories built around what the gear does on a ride, not around brand names."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">No products in this category yet.</p>
        ) : null}
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="Category storytelling" title="Carry systems, on the bike" />
        <article className="mt-8 overflow-hidden rounded-sm border border-border">
          <Media
            src={media.productLuggage}
            alt="Adventure motorcycle fitted with aluminium panniers"
            ratio="16/9"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 md:p-12">
              <h3 className="text-2xl md:text-3xl">Pack once. Ride for eleven days.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Pannier sets, racks and tail bags listed by capacity, mounting type and the variants they fit.
              </p>
            </div>
          </Media>
        </article>
      </Section>
    </>
  );
}
