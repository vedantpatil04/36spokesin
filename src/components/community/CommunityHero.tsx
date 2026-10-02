import { ButtonLink, Media } from "@/components/ui-kit";
import type { MediaAsset } from "@/types";

/**
 * CommunityHero
 *
 * Single, unified editorial hero component:
 * ┌─────────────────────────────────────────┐
 * │         REAL GROUP PHOTOGRAPH           │
 * │    EVERYONE'S FACE CLEARLY VISIBLE      │
 * └─────────────────────────────────────────┘
 *   COMMUNITY
 *   THE PEOPLE BEHIND 36 SPOKES
 *   Founders, riders, stories and the roads we share.
 *   [ MEET THE FOUNDERS ]  [ JOIN 36 SPOKES ]
 *
 * The image and content are children of this one hero component with a
 * shared background and no intermediate section divider or empty gap.
 */
export function CommunityHero({ image }: { image: MediaAsset }) {
  return (
    <header className="relative w-full bg-background border-b border-border/60">
      {/* 1. HERO IMAGE (Full 4:3 frame on mobile so all 10 people are visible without side clipping; editorial height on desktop) */}
      <div
        aria-label="36 Spokes Community"
        className="relative w-full aspect-[4/3] sm:aspect-auto sm:h-[56vh] sm:min-h-[420px] lg:h-[66vh] lg:min-h-[520px] lg:max-h-[720px] overflow-hidden bg-background"
      >
        <Media
          asset={image}
          alt="36 Spokes community riders gathered together at a motorcycle meet"
          ratio="auto"
          className="h-full w-full"
          imgClassName="h-full w-full object-cover object-center sm:object-[center_38%]"
          priority
        />
      </div>

      {/* 2. HERO CONTENT (Directly attached to the image, ~20–28px transition) */}
      <div className="container-page max-w-6xl pt-5 pb-8 sm:pt-6 sm:pb-9 lg:pt-7 lg:pb-10">
        <p className="font-display text-xs sm:text-[0.8rem] uppercase tracking-[0.24em] text-primary">
          Community
        </p>
        <h1 className="mt-1.5 font-display text-2xl uppercase tracking-[0.05em] text-foreground sm:text-4xl lg:text-[3rem] leading-[1.04]">
          The People Behind 36 Spokes
        </h1>
        <p className="mt-2 text-base sm:text-lg lg:text-xl text-foreground/85 max-w-2xl leading-relaxed">
          Founders, riders, stories and the roads we share.
        </p>
        <div className="mt-4.5 sm:mt-5 flex flex-wrap items-center gap-3">
          <ButtonLink
            to="/community"
            hash="founders"
            size="sm"
            className="h-9 px-4 text-xs uppercase tracking-wider"
          >
            Meet the founders
          </ButtonLink>
          <ButtonLink
            to="/join"
            variant="outline"
            size="sm"
            className="h-9 px-4 text-xs uppercase tracking-wider"
          >
            Join 36 Spokes
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
