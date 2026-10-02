import { createFileRoute } from "@tanstack/react-router";
import { CloudSun, MapPin, Route as RouteIcon, Sparkles } from "lucide-react";
import { DestinationCard, TripCard } from "@/components/cards";
import { JourneyPlanner } from "@/components/journey-planner/JourneyPlanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listBikes } from "@/services/catalog";
import { listDestinations, listTrips } from "@/services/travel";

export const Route = createFileRoute("/plan/")({
  loader: async () => {
    const [destinations, trips, bikes] = await Promise.all([
      listDestinations(),
      listTrips(),
      listBikes(),
    ]);
    return { destinations, trips, bikes };
  },
  head: () =>
    seo({
      title: "Plan Your Journey: Route, Weather, Stops & Fuel | 36 Spokes",
      description:
        "Plan a motorcycle journey from real data: the road route with its distance and riding time, the forecast along the way, real towns and fuel stops, and a day-by-day plan.",
      socialDescription:
        "Plan your next motorcycle journey from real route, weather and place data.",
      path: "/plan",
    }),
  component: PlanPage,
});

/** What the planner does, and where each part comes from. Shown as it is: no more, no less. */
const howItWorks = [
  {
    icon: RouteIcon,
    title: "Real roads",
    body: "Your start and destination are looked up on OpenStreetMap, and the route, its distance and its riding time come from a road-routing engine. Nothing is drawn by hand.",
  },
  {
    icon: CloudSun,
    title: "Real forecast",
    body: "The weather along the route comes from a forecast service for your travel dates. When your date is too far ahead to forecast, the plan says so instead of guessing.",
  },
  {
    icon: MapPin,
    title: "Real places",
    body: "Stops and overnight halts are towns, fuel stations and viewpoints that exist on the map near your route. The plan can't name a place that isn't there.",
  },
  {
    icon: Sparkles,
    title: "AI for the plan only",
    body: "An AI model arranges those facts into riding days, breaks and notes. Its answer is checked against the data before you see it, and every section shows its source.",
  },
] as const;

function PlanPage() {
  const { destinations, trips, bikes } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Journey Planner"
        title="Plan your next journey"
        description="Tell us where you start, where you're going, when and how many are riding. Get the real route, the forecast, stops on the way and a day-by-day plan."
        image={media.destinations.ladakh}
        imageAlt="Motorcycle loaded for expedition on a mountain pass in Ladakh"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/plan" hash="planner" size="lg">
            Plan a journey
          </ButtonLink>
          <ButtonLink to="/rides" variant="outline" size="lg">
            Prefer a group ride?
          </ButtonLink>
        </div>
      </PageHeader>

      <Section id="planner" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          eyebrow="Planner"
          title="Where are you riding?"
          description="Four details are enough. Add your motorcycle, pace or budget if you want the plan to account for them."
        />
        <div className="mt-10">
          <JourneyPlanner bikes={bikes} />
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="How it works"
          title="Facts first, then the plan"
          description="The planner doesn't make up travel information. It collects it, then plans from it."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-sm border border-border bg-card p-6 shadow-card"
            >
              <div className="flex size-10 items-center justify-center rounded-sm bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-lg uppercase text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      {destinations.length > 0 ? (
        <Section>
          <SectionHeader
            eyebrow="Destinations"
            title="Places riders head for"
            description="Regions 36 Spokes rides in. Use one as your destination, or type any town."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.slice(0, 6).map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        </Section>
      ) : null}

      {trips.length > 0 ? (
        <Section tone="surface">
          <SectionHeader
            eyebrow="Expeditions"
            title="Fixed-departure journeys"
            description="If you'd rather join a departure that's already planned."
          />
          <Rail className="mt-10 md:grid-cols-2 lg:grid-cols-4">
            {trips.slice(0, 8).map((trip) => (
              <RailItem key={trip.id}>
                <TripCard trip={trip} />
              </RailItem>
            ))}
          </Rail>
        </Section>
      ) : null}

      <Section className="py-12">
        <div className="flex flex-col items-center justify-between gap-6 rounded-sm border border-border bg-card p-8 md:flex-row md:p-12">
          <div className="max-w-xl">
            <span className="font-display text-xs uppercase tracking-[0.2em] text-primary">
              Group rides
            </span>
            <h3 className="mt-2 font-display text-2xl uppercase text-foreground md:text-3xl">
              Prefer to ride with the group?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See the rides 36 Spokes has coming up and book a seat with your rider account.
            </p>
          </div>
          <ButtonLink to="/rides" size="lg" className="shrink-0">
            View upcoming rides <RouteIcon className="size-4" aria-hidden />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
