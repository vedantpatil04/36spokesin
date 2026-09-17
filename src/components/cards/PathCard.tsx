import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { Pillar } from "@/types";
import { cardBase } from "./card-styles";

/** Homepage gateway into one of the five 36 Spokes pillars. Height is set by the parent layout. */
export function PathCard({ pillar, className }: { pillar: Pillar; className?: string }) {
  return (
    <Link to={pillar.to} className={cn(cardBase, "block hover:border-primary/60", className)}>
      <Media
        asset={pillar.image}
        ratio="auto"
        className="h-full"
        imgClassName="group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          <h3 className="text-2xl leading-none md:text-3xl">{pillar.name}</h3>
          <p className="mt-2 max-w-xs text-sm leading-snug text-foreground/80">{pillar.tagline}</p>
          <span className="mt-4 inline-flex items-center gap-2 font-display text-xs uppercase tracking-[0.18em] text-primary">
            {pillar.cta}
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Media>
    </Link>
  );
}
