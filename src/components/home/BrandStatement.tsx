import { ArrowRight } from "lucide-react";
import { BrandCrest, ButtonLink, Section } from "@/components/ui-kit";

export function BrandStatement() {
  return (
    <Section id="brand-statement" tone="surface">
      <div className="mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-1.5 backdrop-blur-md">
          <BrandCrest className="size-4 ring-1 ring-primary/40" />
          <span className="font-display text-xs uppercase tracking-[0.22em] text-foreground">
            The 36 Spokes Ethos
          </span>
        </div>

        <h2 className="mx-auto mt-6 text-3xl uppercase leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          A motorcycle is ridden alone. The road is better shared.
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We believe the best motorcycling moments don't happen in a showroom or on a social feed.
          They happen at 6:00 AM at the city limits, on cold switchbacks in the fog, and in the
          garage with cold coffee and a socket wrench. 36 Spokes exists to connect every part of
          that life.
        </p>

        <div className="mt-8 flex justify-center">
          <ButtonLink to="/about" variant="outline" size="lg">
            Read our philosophy <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
