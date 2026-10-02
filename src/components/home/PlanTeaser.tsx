import { ArrowRight, Compass, Fuel, Map, Mountain, ShieldCheck } from "lucide-react";
import { ButtonLink, Section } from "@/components/ui-kit";
import { media } from "@/data/media";

export function PlanTeaser() {
  return (
    <Section tone="surface" id="plan-your-journey" className="scroll-mt-16 lg:scroll-mt-20">
      <div className="relative overflow-hidden rounded-sm border border-border bg-card shadow-card">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left: Editorial Narrative & Features (Col 1 to 7) */}
          <div className="flex flex-col justify-between p-8 sm:p-12 lg:col-span-7 lg:p-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-[0.7rem] uppercase tracking-[0.2em] text-primary">
                <Map className="size-3.5" aria-hidden />
                <span>JOURNEY BLUEPRINT & AI ROUTING</span>
              </div>

              <h2 className="mt-4 font-display text-3xl uppercase leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Plan your next journey
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                Don’t rely on generic car navigators for two wheels. Build a day-by-day motorcycle
                itinerary tailored to the bike in your garage, with fuel range buffers, high-pass
                acclimatization, and vetted overnight halts.
              </p>

              {/* 3 Pill Highlights */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-sm border border-border/70 bg-surface/50 p-4">
                  <Fuel className="size-4 text-primary" aria-hidden />
                  <h4 className="mt-2 font-display text-xs uppercase tracking-wider text-foreground">
                    Fuel Matching
                  </h4>
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">
                    Tank range calculations for high altitudes.
                  </p>
                </div>

                <div className="rounded-sm border border-border/70 bg-surface/50 p-4">
                  <Mountain className="size-4 text-primary" aria-hidden />
                  <h4 className="mt-2 font-display text-xs uppercase tracking-wider text-foreground">
                    Pass Windows
                  </h4>
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">
                    Acclimatization slopes and seasonal weather.
                  </p>
                </div>

                <div className="rounded-sm border border-border/70 bg-surface/50 p-4">
                  <ShieldCheck className="size-4 text-primary" aria-hidden />
                  <h4 className="mt-2 font-display text-xs uppercase tracking-wider text-foreground">
                    Rider Stays
                  </h4>
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">
                    Secure parking and toolkit-equipped halts.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink to="/plan" size="lg" className="px-6">
                Open Journey Planner <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink to="/plan" hash="planner" variant="outline" size="lg">
                View sample itineraries
              </ButtonLink>
            </div>
          </div>

          {/* Right: Visual Route Preview (Col 8 to 12) */}
          <div className="relative min-h-[320px] lg:col-span-5 lg:min-h-full">
            <img
              src={media.destinations.ladakh.src}
              alt="Motorcycle on an alpine route through the Himalaya"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 size-full object-cover filter contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/20 lg:to-transparent" />

            {/* Overlaid Route Teaser Card */}
            <div className="absolute bottom-6 left-6 right-6 rounded-sm border border-border/80 bg-background/85 p-4 backdrop-blur-md shadow-card">
              <div className="flex items-center justify-between text-xs">
                <span className="font-display uppercase tracking-wider text-primary">
                  FEATURED BLUEPRINT
                </span>
                <span className="text-muted-foreground">Manali → Leh → Zanskar</span>
              </div>
              <p className="mt-1 font-display text-base uppercase text-foreground">
                The Greater Himalayan Loop
              </p>
              <div className="mt-2 flex items-center justify-between text-[0.75rem] text-muted-foreground">
                <span>1,240 km • 8 days</span>
                <span>4 high passes &gt; 16,000 ft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
