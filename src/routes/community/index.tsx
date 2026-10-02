import { createFileRoute } from "@tanstack/react-router";
import { CommunityHero } from "@/components/community/CommunityHero";
import { EditorialFounderCard } from "@/components/community/EditorialFounderCard";
import { MemoryLane } from "@/components/memory-lane/MemoryLane";
import { SocialFeed } from "@/components/social-feed/SocialFeed";
import { ButtonLink, Media, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { env } from "@/lib/env";
import { seo } from "@/lib/seo";
import { listFounders, listMemories } from "@/services/community";
import { listPublishedSocialPosts } from "@/services/social-posts";

export const Route = createFileRoute("/community/")({
  loader: async () => {
    const [founders, memories, socialPosts] = await Promise.all([
      listFounders(),
      listMemories(),
      listPublishedSocialPosts(),
    ]);
    return { founders, memories, socialPosts };
  },
  head: () =>
    seo({
      title: "Community: Founders, Riders & The Road Shared | 36 Spokes",
      description:
        "The people behind 36 Spokes: meet the founders, explore Memory Lane, and follow real dispatches from riders on the road.",
      socialDescription: "The people behind 36 Spokes and the roads they share.",
      path: "/community",
    }),
  component: CommunityPage,
});

function CommunityPage() {
  const { founders, memories, socialPosts } = Route.useLoaderData();
  const coreFounders = founders.filter((f) => !f.role?.toLowerCase().includes("team"));
  const foundingTeam = founders.filter((f) => f.role?.toLowerCase().includes("team"));

  return (
    <>
      {/* 1. COMMUNITY HERO — ONE CONTINUOUS EDITORIAL HERO */}
      <CommunityHero image={media.riders.community} />

      {/* 2. FOUNDERS & FOUNDING TEAM SECTION — COMPACT EDITORIAL */}
      {founders.length > 0 ? (
        <Section id="founders" className="scroll-mt-16 pt-12 sm:pt-14 lg:pt-16 pb-16 lg:pb-24 space-y-16">
          {coreFounders.length > 0 ? (
            <div>
              <div className="mb-8 lg:mb-10">
                <p className="font-display text-xs uppercase tracking-[0.22em] text-primary mb-1.5">
                  Founders
                </p>
                <h2 className="font-display text-2xl uppercase tracking-[0.06em] text-foreground sm:text-3xl lg:text-4xl">
                  The People Who Started It
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:gap-9 max-w-4xl">
                {coreFounders.map((founder) => (
                  <EditorialFounderCard key={founder.id} founder={founder} />
                ))}
              </div>
            </div>
          ) : null}

          {foundingTeam.length > 0 ? (
            <div className="border-t border-border/60 pt-14">
              <div className="mb-8 lg:mb-10">
                <p className="font-display text-xs uppercase tracking-[0.22em] text-primary mb-1.5">
                  Founding Team
                </p>
                <h2 className="font-display text-2xl uppercase tracking-[0.06em] text-foreground sm:text-3xl lg:text-4xl">
                  Founding Team
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 md:gap-7 max-w-6xl">
                {foundingTeam.map((member) => (
                  <EditorialFounderCard key={member.id} founder={member} />
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* 3. COMMUNITY STATEMENT — CLEAN & RESTRAINED */}
      <section
        aria-labelledby="community-statement-heading"
        className="border-y border-border/70 bg-surface/35 py-14 sm:py-18 lg:py-20"
      >
        <div className="container-page">
          <div className="grid grid-cols-1 items-baseline gap-6 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-5">
              <p className="mb-1.5 font-display text-xs uppercase tracking-[0.22em] text-primary">
                Philosophy
              </p>
              <h2
                id="community-statement-heading"
                className="font-display text-2xl uppercase tracking-[0.06em] text-foreground sm:text-3xl lg:text-4xl leading-[1.06]"
              >
                More Than A Ride
              </h2>
            </div>
            <div className="flex flex-col justify-center md:col-span-7">
              <p className="text-lg font-light leading-snug text-foreground/90 sm:text-xl">
                A motorcycle is ridden alone, but the road is better shared.
              </p>
              <p className="mt-4 font-display text-xs uppercase tracking-[0.24em] text-muted-foreground/80 sm:text-sm">
                Riders · Stories · Chapters · Events · Memories
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEMORY LANE */}
      <Section id="memory-lane" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          eyebrow="Memory Lane"
          title="Where The Road Has Taken Us"
          description="Moments from past rides and expeditions."
        />
        <div className="mt-8 lg:mt-10">
          <MemoryLane memories={memories} />
        </div>
      </Section>

      {/* 5. FOLLOW 36 SPOKES */}
      <section
        id="follow"
        aria-labelledby="follow-heading"
        className="border-t border-border/70 bg-surface/25 py-12 sm:py-16"
      >
        <div className="container-page">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1.5 font-display text-xs uppercase tracking-[0.22em] text-primary">
                Connect
              </p>
              <h2
                id="follow-heading"
                className="font-display text-2xl uppercase tracking-[0.06em] text-foreground sm:text-3xl lg:text-4xl"
              >
                Follow 36 Spokes
              </h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                The roads, the rides and everything between them.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={env.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-sm border border-border/80 bg-surface px-5 py-3 font-display text-xs uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary hover:shadow-xs focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span>Instagram</span>
                <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </a>

              {env.whatsappGroupUrl ? (
                <a
                  href={env.whatsappGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-sm border border-border/80 bg-surface px-5 py-3 font-display text-xs uppercase tracking-[0.18em] text-foreground transition-all hover:border-primary hover:text-primary hover:shadow-xs focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span>WhatsApp Group</span>
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FROM THE ROAD — REAL INSTAGRAM FEED */}
      <SocialFeed
        id="instagram-feed"
        posts={socialPosts}
        eyebrow="From The Road"
        title="Real Instagram Feed"
        description="Live dispatches from riders on the road."
        className="scroll-mt-16 border-t border-border/70 py-14 sm:py-18 lg:scroll-mt-20"
      />

      {/* 7. FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border py-18 sm:py-22 lg:py-24">
        <div className="absolute inset-0">
          <Media
            asset={media.site.heroRide}
            alt="Motorcycle rider climbing a mountain road"
            ratio="auto"
            className="h-full w-full"
          >
            <div className="h-full w-full bg-background/85 backdrop-blur-[1px]" />
          </Media>
        </div>

        <div className="container-page relative z-10 text-center">
          <p className="font-display text-xs uppercase tracking-[0.24em] text-primary">36 Spokes</p>
          <h2 className="mx-auto mt-2 max-w-3xl font-display text-2xl uppercase tracking-[0.06em] text-foreground sm:text-3xl lg:text-4xl leading-[1.08]">
            The Road Is Better Shared.
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-sm text-foreground/80">
            Join the collective and ride with us.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink
              to="/join"
              size="md"
              className="px-6 py-2.5 text-xs uppercase tracking-wider"
            >
              Join 36 Spokes
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
