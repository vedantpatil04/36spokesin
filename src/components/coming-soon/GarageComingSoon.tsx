import { Compass, Map, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { BrandCrest } from "@/components/ui-kit";
import { ButtonLink } from "@/components/ui-kit";
import { Section } from "@/components/ui-kit";
import { media } from "@/data/media";

/**
 * Premium motorcycle silhouette graphic featuring bespoke 36-spoke wheels,
 * dark editorial styling, and subtle pulse glow.
 */
function MotorcycleSilhouette() {
  return (
    <div className="relative mx-auto w-full max-w-2xl select-none py-6">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-radial from-primary/15 via-primary/5 to-transparent blur-2xl"
      />

      {/* Workshop image backdrop with dark overlay */}
      <div className="relative overflow-hidden rounded-lg border border-border/80 bg-surface/60 backdrop-blur-md shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={media.garage.workshop.src}
            alt="Motorcycle garage workshop atmosphere"
            className="h-full w-full object-cover opacity-25 filter grayscale contrast-125 transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />

          {/* Centerpiece Vector Silhouette */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <svg
              viewBox="0 0 600 300"
              className="h-36 sm:h-48 w-auto max-w-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Motorcycle silhouette with 36 spokes"
            >
              <defs>
                <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="oklch(0.9 0.01 60)" />
                  <stop offset="50%" stopColor="oklch(0.68 0.17 46)" />
                  <stop offset="100%" stopColor="oklch(0.45 0.02 50)" />
                </linearGradient>
                <linearGradient id="orangeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.68 0.17 46)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="oklch(0.78 0.13 85)" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Rear Wheel (36 spokes motif) */}
              <g transform="translate(130, 200)">
                <circle
                  cx="0"
                  cy="0"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted-foreground/50"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="44"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/60"
                />
                <circle cx="0" cy="0" r="14" fill="currentColor" className="text-primary" />
                {/* Spokes */}
                {Array.from({ length: 18 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={Math.cos((i * 20 * Math.PI) / 180) * 44}
                    y2={Math.sin((i * 20 * Math.PI) / 180) * 44}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeOpacity="0.55"
                    className="text-foreground"
                  />
                ))}
              </g>

              {/* Front Wheel (36 spokes motif) */}
              <g transform="translate(460, 195)">
                <circle
                  cx="0"
                  cy="0"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted-foreground/50"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary/60"
                />
                <circle cx="0" cy="0" r="14" fill="currentColor" className="text-primary" />
                {/* Spokes */}
                {Array.from({ length: 18 }).map((_, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1="0"
                    x2={Math.cos(((i * 20 + 10) * Math.PI) / 180) * 48}
                    y2={Math.sin(((i * 20 + 10) * Math.PI) / 180) * 48}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeOpacity="0.55"
                    className="text-foreground"
                  />
                ))}
              </g>

              {/* Swingarm & Rear Suspension */}
              <path
                d="M 130 200 L 250 195 L 285 150 L 220 185 Z"
                fill="currentColor"
                className="text-muted-foreground/30"
              />
              <line
                x1="190"
                y1="180"
                x2="245"
                y2="135"
                stroke="url(#metalGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Engine Block Silhouette */}
              <path
                d="M 230 195 L 340 195 L 360 145 L 290 125 L 230 155 Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                className="text-surface-2 text-foreground/40"
              />
              {/* Cooling fins detail */}
              <line
                x1="250"
                y1="145"
                x2="320"
                y2="145"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/60"
              />
              <line
                x1="255"
                y1="160"
                x2="330"
                y2="160"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/60"
              />
              <line
                x1="260"
                y1="175"
                x2="335"
                y2="175"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/60"
              />

              {/* Exhaust Pipe & Muffler */}
              <path
                d="M 310 170 Q 280 220 220 200 L 140 175"
                fill="none"
                stroke="url(#metalGrad)"
                strokeWidth="7"
                strokeLinecap="round"
              />

              {/* Frame & Tank Backbone */}
              <path
                d="M 230 155 L 285 110 L 375 105 L 435 90"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-foreground/70"
              />

              {/* Adventure Fuel Tank & Seat Profile */}
              <path
                d="M 160 135 C 190 135, 230 145, 270 140 C 300 120, 320 85, 380 90 C 410 93, 425 110, 395 130 C 350 140, 320 145, 280 145 Z"
                fill="url(#orangeGlow)"
              />

              {/* Front Fork & Handlebars */}
              <line
                x1="460"
                y1="195"
                x2="430"
                y2="70"
                stroke="url(#metalGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 430 70 L 415 60 L 400 62"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                className="text-foreground"
              />

              {/* Headlight & Windscreen Silhouette */}
              <path
                d="M 435 85 L 460 85 L 450 55 L 430 70"
                fill="currentColor"
                className="text-primary/70"
              />
              <line
                x1="455"
                y1="85"
                x2="475"
                y2="85"
                stroke="url(#orangeGlow)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Ground Shadow */}
              <ellipse cx="295" cy="265" rx="220" ry="12" fill="black" opacity="0.6" />
            </svg>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span>Engineering in progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GarageComingSoon() {
  return (
    <div className="relative min-h-[80vh] overflow-hidden">
      {/* Background aesthetic grid / ambient gradients */}
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
              GARAGE
            </span>
            <span className="text-border-strong">·</span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
              COMING SOON
            </span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            YOUR BIKE.
            <br className="hidden sm:inline" /> YOUR SETUP.
            <br className="hidden sm:inline" /> YOUR ROAD.
          </h1>

          {/* Exact required copy */}
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            Your personalized motorcycle garage is on the way.
          </p>

          {/* Hero Visual */}
          <div className="mt-8 sm:mt-12">
            <MotorcycleSilhouette />
          </div>

          {/* Value Highlights Preview (No fake bikes or fake data) */}
          <div className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Wrench className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Model & Fitment Intelligence
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Connect your motorcycle brand, model, and engine variant to eliminate fitment
                guesswork.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Trip-Ready Verification
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Tailored equipment checklists matched to extreme terrain and long-distance
                expedition requirements.
              </p>
            </div>

            <div className="rounded-sm border border-border bg-card/60 p-6 backdrop-blur-sm">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h3 className="font-display text-base uppercase tracking-wider text-foreground">
                Build & Service History
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Log mods, luggage setups, maintenance intervals, and track gear wear across every
                journey.
              </p>
            </div>
          </div>

          {/* Seamless navigation to explore active sections */}
          <div className="mt-14 rounded-sm border border-border/80 bg-surface/50 p-8 text-center backdrop-blur-sm">
            <h2 className="font-display text-lg uppercase tracking-wider text-foreground sm:text-xl">
              While we prepare the garage, hit the road
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Join upcoming rides, explore documented travel journeys, or connect with fellow
              riders.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink to="/rides" size="lg">
                <Compass className="mr-2 size-4" />
                Community Rides
              </ButtonLink>
              <ButtonLink to="/travel" variant="outline" size="lg">
                <Map className="mr-2 size-4" />
                Travel Journeys
              </ButtonLink>
              <ButtonLink to="/join" variant="ghost" size="lg">
                Join 36 Spokes
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
