import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass, Mail, MapPin, Shield, Users, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BrandCrest, ButtonLink, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listFounders } from "@/services/community";

export const Route = createFileRoute("/about/")({
  loader: async () => {
    const founders = await listFounders();
    return { founders };
  },
  head: () =>
    seo({
      title: "About 36 Spokes: The Machine, The Journey & The Rider | 36 Spokes",
      description:
        "The story, philosophy and founders behind 36 Spokes. Built around the motorcycle you ride, the gear that fits it, and the journeys you share.",
      socialDescription: "The motorcycle lifestyle, adventure and rider ecosystem.",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  const { founders } = Route.useLoaderData();
  const coreFounders = founders.filter((f) => !f.role?.toLowerCase().includes("team"));
  const foundingTeam = founders.filter((f) => f.role?.toLowerCase().includes("team"));

  return (
    <>
      <PageHeader
        eyebrow="About 36 Spokes"
        title="Tensioned together for the road"
        description="A spoked wheel needs 36 spokes under balanced tension to carry weight across rock, sand and broken asphalt. That principle is what we build on."
        image={media.site.about}
        imageAlt="Royal Enfield Interceptor 650 and Continental GT 650 parked along a scenic coastal road"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/about" hash="ethos" size="lg">
            Our philosophy
          </ButtonLink>
          <ButtonLink to="/community" variant="outline" size="lg">
            Meet the community
          </ButtonLink>
        </div>
      </PageHeader>

      {/* WHY 36 SPOKES */}
      <Section id="ethos" className="scroll-mt-16 lg:scroll-mt-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <span className="font-display text-xs uppercase tracking-[0.24em] text-primary">
              THE STORY & PHILOSOPHY
            </span>
            <h2 className="mt-3 text-3xl leading-[1.08] sm:text-4xl lg:text-5xl">
              Motorcycling is not a transaction. It is an ownership and adventure culture.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-relaxed text-muted-foreground md:text-lg">
            <p>
              In modern motorcycle commerce, platforms treat riders like generic shoppers looking
              for accessories. But real motorcycling doesn’t work like that.
            </p>
            <p>
              Everything in a rider’s world starts with the motorcycle in their garage: its tank
              range, its mounting points, its clearance, and how it behaves when the road surface
              ends. The gear that fits it, the route it can tackle, and the companions who ride at
              that pace must all align.
            </p>
            <p className="text-foreground">
              36 Spokes was created to unify those disparate pieces into one cohesive home: your
              motorcycle, gear matched to that specific machine, route planning that respects
              elevation and fuel stops, and the riders you meet along the way.
            </p>
          </div>
        </div>
      </Section>

      {/* THE 5 PRINCIPLES */}
      <Section tone="surface">
        <SectionHeader
          eyebrow="The Framework"
          title="How 36 Spokes connects the ride"
          description="Five interrelated disciplines that turn isolated motorcycling into a complete lifestyle ecosystem."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Compass className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg uppercase text-foreground">1. Rides</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Day loops, weekenders and sunrise rides led by verified marshals. Real people on the
              tarmac.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <MapPin className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg uppercase text-foreground">2. Plan</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Intelligent route blueprints, fuel calculations, mountain passes and day-by-day halts.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Shield className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg uppercase text-foreground">3. Shop</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Curated armor, luggage and protective equipment matched specifically to your bike.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Wrench className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg uppercase text-foreground">4. Garage</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Digital twin for your motorcycle: maintenance intervals, modification logs and setup
              checks.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
              <Users className="size-5" aria-hidden />
            </div>
            <h3 className="font-display text-lg uppercase text-foreground">5. Community</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Rider stories written from the saddle, regional chapters and the human moments shared.
            </p>
          </div>
        </div>
      </Section>

      {/* FOUNDING SECTION — ONLY NAMES */}
      {founders.length > 0 ? (
        <Section id="founders" className="scroll-mt-16 lg:scroll-mt-20 space-y-14">
          {coreFounders.length > 0 ? (
            <div>
              <SectionHeader
                eyebrow="Founders"
                title="The Founders"
                description="The people who started 36 Spokes, steering its vision and road culture."
              />
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 max-w-2xl">
                {coreFounders.map((founder) => (
                  <li
                    key={founder.id}
                    className="flex flex-col justify-center rounded-sm border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
                  >
                    <h3 className="font-display text-2xl uppercase tracking-wide text-foreground">
                      {founder.name}
                    </h3>
                    <p className="mt-1 font-display text-xs uppercase tracking-[0.2em] text-primary">
                      {founder.role || "Founder"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {foundingTeam.length > 0 ? (
            <div className="border-t border-border/60 pt-12">
              <SectionHeader
                eyebrow="Founding Team"
                title="Founding Team"
                description="The core team bringing 36 Spokes to life across operations, community, and road culture."
              />
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl">
                {foundingTeam.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-col justify-center rounded-sm border border-border bg-card p-6 shadow-card transition-colors hover:border-primary/40"
                  >
                    <h3 className="font-display text-2xl uppercase tracking-wide text-foreground">
                      {member.name}
                    </h3>
                    <p className="mt-1 font-display text-xs uppercase tracking-[0.2em] text-primary">
                      {member.role || "Founding Team"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* CONTACT & CONNECT */}
      <Section tone="surface">
        <div className="mx-auto max-w-3xl text-center">
          <BrandCrest className="mx-auto size-14 ring-1 ring-primary/40 shadow-card" />
          <h2 className="mt-6 text-3xl uppercase tracking-tight text-foreground sm:text-4xl">
            Ride with us
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Whether you want to organize a local weekend chapter, recommend a route corridor, or
            reach the founders directly.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:contact@36spokes.in"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Mail className="size-4" aria-hidden />
              <span>contact@36spokes.in</span>
            </a>
            <ButtonLink to="/join" size="lg">
              Join 36 Spokes <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
