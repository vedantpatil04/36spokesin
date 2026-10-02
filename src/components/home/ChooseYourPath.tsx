import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Map, Shield, Users, Wrench } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { Pillar } from "@/types";

const icons: Record<string, React.ElementType> = {
  rides: Compass,
  plan: Map,
  shop: Shield,
  garage: Wrench,
  community: Users,
};

export function ChooseYourPath({ paths }: { paths: Pillar[] }) {
  const ridesPath = paths.find((p) => p.id === "rides") || paths[0];
  const planPath = paths.find((p) => p.id === "plan") || paths[1];
  const shopPath = paths.find((p) => p.id === "shop") || paths[2];
  const garagePath = paths.find((p) => p.id === "garage") || paths[3];
  const communityPath = paths.find((p) => p.id === "community") || paths[4];

  return (
    <Section id="choose-your-path" tone="surface" className="scroll-mt-16 lg:scroll-mt-20">
      <SectionHeader
        eyebrow="Choose Your Path"
        title="Enter the 36 Spokes world"
        description="Whether you want to ride this weekend, map out a high-altitude expedition, or meet the community."
      />

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {/* 1. RIDES — DOMINANT HERO BLOCK (Col 1 to 7) */}
        {ridesPath && (
          <PathCardItem
            path={ridesPath}
            className="lg:col-span-7 h-80 sm:h-96 lg:h-[26rem]"
            icon={icons["rides"]}
            featured
          />
        )}

        {/* 2. PLAN — DOMINANT SECONDARY BLOCK (Col 8 to 12) */}
        {planPath && (
          <PathCardItem
            path={planPath}
            className="lg:col-span-5 h-80 sm:h-96 lg:h-[26rem]"
            icon={icons["plan"]}
            featured
          />
        )}

        {/* 3. SHOP — SUPPORTING (Col 1 to 3) */}
        {shopPath && (
          <PathCardItem
            path={shopPath}
            className="lg:col-span-3 h-64 sm:h-72 lg:h-80"
            icon={icons["shop"]}
          />
        )}

        {/* 4. GARAGE — SUPPORTING (Col 4 to 6) */}
        {garagePath && (
          <PathCardItem
            path={garagePath}
            className="lg:col-span-3 h-64 sm:h-72 lg:h-80"
            icon={icons["garage"]}
          />
        )}

        {/* 5. COMMUNITY — WIDE EDITORIAL (Col 7 to 12) */}
        {communityPath && (
          <PathCardItem
            path={communityPath}
            className="lg:col-span-6 h-64 sm:h-72 lg:h-80"
            icon={icons["community"]}
          />
        )}
      </div>
    </Section>
  );
}

function PathCardItem({
  path,
  className,
  icon: Icon,
  featured = false,
}: {
  path: Pillar;
  className?: string | undefined;
  icon?: React.ElementType | undefined;
  featured?: boolean | undefined;
}) {
  return (
    <Link
      to={path.to}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-sm border border-border bg-card shadow-card transition-all duration-500",
        "hover:border-primary/70 hover:shadow-lift",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      {/* Background Photography with Zoom Effect */}
      <img
        src={path.image.src}
        alt={path.image.alt || path.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Atmospheric Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-transparent transition-opacity duration-300 group-hover:via-background/55" />
      <div className="absolute inset-0 bg-radial from-transparent to-background/50 pointer-events-none" />

      {/* Badge (e.g. Coming Soon) */}
      {path.badge ? (
        <div className="absolute right-4 top-4 z-10">
          <span className="rounded-full border border-primary/40 bg-background/85 px-3 py-1 font-display text-[0.65rem] uppercase tracking-[0.2em] text-primary backdrop-blur-md">
            {path.badge}
          </span>
        </div>
      ) : null}

      {/* Content */}
      <div className="relative z-10 p-6 sm:p-7">
        <div className="mb-2 flex items-center gap-2">
          {Icon ? (
            <div className="flex size-7 items-center justify-center rounded-sm bg-primary/20 text-primary">
              <Icon className="size-3.5" aria-hidden />
            </div>
          ) : null}
          <span className="font-display text-[0.7rem] uppercase tracking-[0.22em] text-primary">
            {path.id}
          </span>
        </div>

        <h3
          className={cn(
            "font-display uppercase tracking-tight text-foreground transition-colors group-hover:text-primary-foreground/90",
            featured ? "text-3xl sm:text-4xl" : "text-2xl",
          )}
        >
          {path.name}
        </h3>

        <p className="mt-2 line-clamp-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {path.tagline}
        </p>

        <div className="mt-4 flex items-center gap-2 font-display text-xs uppercase tracking-[0.18em] text-primary transition-transform duration-300 group-hover:translate-x-1">
          <span>{path.cta}</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </div>
      </div>
    </Link>
  );
}
