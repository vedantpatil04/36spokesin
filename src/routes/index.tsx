import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass, Shield, Users, Wrench } from "lucide-react";
import { CinematicHero } from "@/components/hero/CinematicHero";
import { BrandStatement } from "@/components/home/BrandStatement";
import { ChooseYourPath } from "@/components/home/ChooseYourPath";
import { FeaturedRides } from "@/components/home/FeaturedRides";
import { PlanTeaser } from "@/components/home/PlanTeaser";
import { MemoryLane } from "@/components/memory-lane/MemoryLane";
import { SocialFeed } from "@/components/social-feed/SocialFeed";
import { BrandCrest, ButtonLink, Section, SectionHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listMemories } from "@/services/community";
import { listRides } from "@/services/rides";
import { listHeroSlides, listPillars } from "@/services/site";
import { listPublishedSocialPosts } from "@/services/social-posts";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [heroSlides, pillars, rides, memories, socialPosts] = await Promise.all([
      listHeroSlides(),
      listPillars(),
      listRides({ when: "upcoming" }),
      listMemories(),
      listPublishedSocialPosts(),
    ]);
    return { heroSlides, pillars, rides, memories, socialPosts };
  },
  head: () =>
    seo({
      title: "36 Spokes | Motorcycle Rides, Journey Planning & Rider Culture",
      description:
        "The motorcycle lifestyle ecosystem. Group rides across India, intelligent journey planning, gear matched to your motorcycle, and a community of authentic riders.",
      socialDescription:
        "Your motorcycle, your gear, your next journey and the riders you share it with.",
      path: "/",
    }),
  component: Home,
});

const connectionSteps = [
  { label: "Your Bike", desc: "The foundation in your garage" },
  { label: "Your Gear", desc: "Matched protection & luggage" },
  { label: "Your Journey", desc: "Day-by-day fuel & halts" },
  { label: "Your Route", desc: "Tarmac, passes & gravel" },
  { label: "Your People", desc: "Riders who turn up" },
];

function Home() {
  const { heroSlides, pillars, rides, memories, socialPosts } = Route.useLoaderData();

  return (
    <>
      {/* A. CINEMATIC HERO (Custom 5s auto-advance carousel, image + video, CMS-backed) */}
      <CinematicHero slides={heroSlides} />

      {/* B. WHAT IS 36 SPOKES? (Continuous editorial narrative) */}
      <Section id="what-is-36-spokes" className="scroll-mt-16 lg:scroll-mt-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16">
          <div>
            <span className="font-display text-xs uppercase tracking-[0.24em] text-primary">
              THE 36 SPOKES PRINCIPLE
            </span>
            <h2 className="mt-3 text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">
              What is 36 Spokes?
            </h2>
          </div>

          <div>
            <p className="max-w-2xl text-xl leading-snug text-foreground md:text-2xl">
              A home for Indian motorcyclists, built from the motorcycle you ride. The gear that
              fits it, the journeys you take it on, and the riders you meet along the way all
              connect back to that machine.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-3">
              {connectionSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="relative rounded-sm border border-border/80 bg-surface/40 p-3.5 backdrop-blur-xs transition-colors hover:border-primary/50"
                >
                  <span className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-primary">
                    0{index + 1}
                  </span>
                  <h4 className="mt-1 font-display text-sm uppercase text-foreground">
                    {step.label}
                  </h4>
                  <p className="mt-1 text-[0.7rem] text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* C. CHOOSE YOUR PATH (Editorial/Asymmetrical composition: Rides, Plan, Shop, Garage, Community) */}
      <ChooseYourPath paths={pillars} />

      {/* D. FEATURED RIDES (What is happening on the road) */}
      <FeaturedRides rides={rides} />

      {/* E. PLAN YOUR NEXT JOURNEY (Compelling teaser pointing to Plan hub) */}
      <PlanTeaser />

      {/* F. MEMORY LANE (Visual storytelling for past rides / milestones) */}
      <Section id="memory-lane">
        <SectionHeader
          eyebrow="The Archive"
          title="36 Spokes Memory Lane"
          description="Where the community has been: the high passes, monsoon runs, Sunday meets and garage nights that made 36 Spokes."
          action={
            <ButtonLink to="/stories" variant="outline">
              Read ride stories <ArrowRight className="size-3.5" aria-hidden />
            </ButtonLink>
          }
        />
        <div className="mt-10">
          <MemoryLane memories={memories} />
        </div>
      </Section>

      {/* G. FOLLOW THE RIDE (Dynamic Instagram / Social feed with video support) */}
      <SocialFeed posts={socialPosts} />

      {/* H. ABOUT / BRAND STATEMENT */}
      <BrandStatement />

      {/* I. FINAL CTA */}
      <Section className="pt-0 md:pt-0">
        <div className="relative overflow-hidden rounded-sm border border-border bg-card px-6 py-16 text-center md:px-16 md:py-24 shadow-lift">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 bg-radial from-primary/10 via-transparent to-transparent blur-2xl"
          />
          <BrandCrest
            className="relative mx-auto size-16 ring-2 ring-primary/40 shadow-card"
            loading="lazy"
          />
          <h2 className="relative mx-auto mt-6 max-w-3xl text-3xl uppercase leading-tight sm:text-4xl lg:text-5xl">
            Keep your bike, your gear and your next ride in one place
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Create a rider profile, register your motorcycle, and everything on 36 Spokes starts
            speaking your bike's language.
          </p>
          <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/join" size="lg" className="px-8 shadow-card">
              Create your rider profile
            </ButtonLink>
            <ButtonLink to="/rides" variant="outline" size="lg">
              Explore upcoming rides
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
