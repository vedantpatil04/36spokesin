import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Media, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { PathCard, UpcomingEventCard } from "@/components/cards";
import { JourneyPlanner } from "@/components/journey-planner/JourneyPlanner";
import { MemoryLane } from "@/components/memory-lane/MemoryLane";
import { events, media, memories, pillars } from "@/data/content";
import { cn } from "@/lib/utils";

const TITLE = "36 Spokes | Motorcycle Rides, Travel, Gear & Rider Community";
const DESCRIPTION =
  "36 Spokes brings your motorcycle, the gear that fits it, the journeys you plan and the riders you meet into one place. Find a ride, plan a trip and join upcoming events.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: "Your bike, your gear, your next journey and the riders you share it with.",
      },
    ],
  }),
  component: Home,
});

/** Tablet layout: two wide cards, then three. Desktop: five across. */
const pathLayout = [
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-2",
];

const connection = ["Bike", "Gear", "Trip", "Route", "Riders"];

/** Upcoming events are sorted by date; the homepage shows the next three. */
const nextEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 3);

function Home() {
  return (
    <>
      {/* A. HERO */}
      <section className="relative">
        <Media
          src={media.heroRide}
          alt="Rider on a loaded adventure motorcycle climbing a Himalayan mountain road at sunrise"
          ratio="auto"
          className="h-[78svh] min-h-125 w-full lg:h-[88svh]"
          priority
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
        </Media>
        <div className="absolute inset-0 flex items-end">
          <div className="container-page pb-14 md:pb-20">
            <div className="max-w-3xl rise">
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-background/70 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                <img
                  src={media.brandLogo}
                  alt="36 Spokes Official Crest"
                  className="size-5 rounded-full object-cover ring-1 ring-primary/40"
                />
                <span className="font-display text-xs uppercase tracking-[0.2em] text-foreground/90">
                  Official 36 Spokes Rider Network
                </span>
              </div>
              <h1 className="text-4xl leading-[0.98] sm:text-6xl lg:text-7xl">
                The road starts where the map runs out
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Expeditions across the Himalaya, gear matched to the motorcycle in your garage, and
                riders who turn up when you post a route.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/" hash="choose-your-path" size="lg">
                  Choose your path <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <ButtonLink to="/" hash="plan-your-journey" variant="outline" size="lg">
                  Plan a journey
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. WHAT IS 36 SPOKES? */}
      <Section id="what-is-36-spokes">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16">
          <h2 className="text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">What is 36 Spokes?</h2>
          <div>
            <p className="max-w-2xl text-xl leading-snug text-foreground md:text-2xl">
              A home for Indian motorcyclists, built around the bike you ride. The gear that fits
              it, the trips you take it on and the riders you meet along the way all start from
              there.
            </p>
            <ol
              aria-label="How 36 Spokes connects"
              className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3 font-display text-[0.8rem] uppercase tracking-[0.12em] sm:gap-x-3 sm:text-sm sm:tracking-[0.18em] md:text-base"
            >
              {connection.map((step, index) => (
                <li key={step} className="flex items-center gap-2 sm:gap-3">
                  {index > 0 ? (
                    <span aria-hidden className="h-px w-3 bg-primary/70 sm:w-6 md:w-10" />
                  ) : null}
                  <span className={index === 0 ? "text-primary" : "text-foreground/85"}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* C. CHOOSE YOUR PATH */}
      <Section id="choose-your-path" tone="surface" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          title="Choose your path"
          description="What do you want to do today? Each path opens its own section with the full detail."
        />
        <ul className="mt-10 grid gap-3 md:grid-cols-6 md:gap-4 lg:grid-cols-5">
          {pillars.map((pillar, index) => (
            <li key={pillar.id} className={cn(pathLayout[index], "lg:col-span-1")}>
              <PathCard pillar={pillar} className="h-44 sm:h-52 md:h-72 lg:h-[30rem]" />
            </li>
          ))}
        </ul>
      </Section>

      {/* D. 36 SPOKES UPCOMING EVENTS */}
      <Section id="upcoming-events">
        <SectionHeader
          title="36 Spokes Upcoming Events"
          description="Rides, meetups and workshops run by 36 Spokes crews. The listings below are sample events for this preview."
          action={
            <ButtonLink to="/community" hash="events" variant="outline">
              All events
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-3">
          {nextEvents.map((event) => (
            <RailItem key={event.id}>
              <UpcomingEventCard
                event={event}
                action={
                  <Link
                    to="/community"
                    hash={event.id}
                    aria-label={`View event: ${event.title}`}
                    className="shrink-0 font-display text-xs uppercase tracking-[0.18em] text-primary hover:underline"
                  >
                    View event
                  </Link>
                }
              />
            </RailItem>
          ))}
        </Rail>
      </Section>

      {/* E. PLAN YOUR JOURNEY */}
      <Section id="plan-your-journey" tone="surface" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          title="Plan your journey"
          description="An early look at the 36 Spokes journey planner. Pick your route, dates, bike and riding style, and get a day-by-day plan with distance, stays, places to visit, weather, fuel and cost."
        />
        <div className="mt-10">
          <JourneyPlanner />
        </div>
      </Section>

      {/* F. 36 SPOKES MEMORY LANE */}
      <Section id="memory-lane">
        <SectionHeader
          title="36 Spokes Memory Lane"
          description="Where the community has been: the expeditions, Sunday rides and garage nights that made 36 Spokes. Sample memories for this preview."
          action={
            <ButtonLink to="/stories" variant="outline">
              Read ride stories
            </ButtonLink>
          }
        />
        <div className="mt-10">
          <MemoryLane memories={memories} />
        </div>
      </Section>

      {/* G. JOIN / DISCOVER */}
      <Section className="pt-0 md:pt-0">
        <div className="rounded-sm border border-border bg-card px-6 py-14 text-center md:px-16 md:py-20">
          <img
            src={media.brandLogo}
            alt=""
            loading="lazy"
            decoding="async"
            className="mx-auto size-16 rounded-full object-cover ring-2 ring-primary/40 shadow-card"
          />
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Keep your bike, your gear and your next ride in one place
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Create a rider profile, add your motorcycle, and everything on 36 Spokes starts speaking
            your bike's language.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/join" size="lg">
              Create your rider profile
            </ButtonLink>
            <ButtonLink to="/travel" variant="outline" size="lg">
              Browse expeditions
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
