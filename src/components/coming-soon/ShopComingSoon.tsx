import { Compass, Map, PackageCheck, Shield, Sparkles } from "lucide-react";
import { BrandCrest } from "@/components/ui-kit";
import { ButtonLink } from "@/components/ui-kit";
import { Section } from "@/components/ui-kit";
import { media } from "@/data/media";

/**
 * Editorial visual composition for the Shop Coming Soon state.
 * Features dark motorcycle gear photography with cinematic gradient overlays.
 */
function ShopVisualBanner() {
  return (
    <div className="relative mx-auto w-full max-w-4xl select-none py-6">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-radial from-primary/15 via-primary/5 to-transparent blur-2xl"
      />

      <div className="relative grid gap-4 overflow-hidden rounded-lg border border-border/80 bg-surface/60 p-2 sm:grid-cols-2 backdrop-blur-md shadow-2xl">
        {/* Protection image card */}
        <div className="group relative h-64 sm:h-72 overflow-hidden rounded-md border border-border/60">
          <img
            src={media.products.protect.src}
            alt="Adventure helmet and technical riding protection"
            className="h-full w-full object-cover opacity-40 filter grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
              CATEGORY PREVIEW
            </span>
            <h3 className="font-display text-xl uppercase text-foreground">Protection & Apparel</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Certified armor, weather-proof outerwear, and helmets tested in all climates.
            </p>
          </div>
        </div>

        {/* Luggage image card */}
        <div className="group relative h-64 sm:h-72 overflow-hidden rounded-md border border-border/60">
          <img
            src={media.products.luggage.src}
            alt="Adventure motorcycle carry and luggage system"
            className="h-full w-full object-cover opacity-40 filter grayscale contrast-125 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary">
              CATEGORY PREVIEW
            </span>
            <h3 className="font-display text-xl uppercase text-foreground">
              Luggage & Carry Systems
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Waterproof panniers, tailbags, and modular racks built for rough terrain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopComingSoon() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.68_0.17_46_/_0.12),transparent_70%)]"
      />

      <Section className="pt-12 sm:pt-16 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow & Brand Crest */}
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-border/80 bg-surface/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <BrandCrest className="size-5 ring-1 ring-primary/40" />
            <span className="font-display text-xs uppercase tracking-[0.25em] text-primary">
              SHOP
            </span>
            <span className="text-border-strong">·</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              COMING SOON
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            GEAR FOR THE
            <br /> ROAD AHEAD.
          </h1>

          {/* Exact required copy */}
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Curated motorcycle gear and equipment are coming to 36 Spokes.
          </p>

          {/* Editorial Visual Banner */}
          <div className="mt-8 sm:mt-12">
            <ShopVisualBanner />
          </div>

          {/* Curated Principles */}
          <div className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Shield className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Field-Tested Durability
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Only equipment that has proven its reliability over high mileage and difficult
                backcountry terrain.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <PackageCheck className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Chassis-Specific Fitment
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Each product is verified against your exact motorcycle model and variant so it
                installs cleanly.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Curated, Not Cluttered
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                A tight, purposeful lineup of essential gear instead of thousands of generic catalog
                items.
              </p>
            </div>
          </div>

          {/* Seamless navigation to explore active sections */}
          <div className="mt-14 rounded-sm border border-border/80 bg-surface/50 p-8 text-center backdrop-blur-sm">
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground sm:text-xl">
              Get ready for your next ride
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              In the meantime, explore planned expeditions, join fellow riders, or discover new
              routes.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to="/travel" size="lg">
                <Map className="mr-2 size-4" />
                Travel Journeys
              </ButtonLink>
              <ButtonLink to="/rides" variant="outline" size="lg">
                <Compass className="mr-2 size-4" />
                Upcoming Rides
              </ButtonLink>
              <ButtonLink to="/community" variant="ghost" size="lg">
                Rider Community
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
