import { createFileRoute } from "@tanstack/react-router";
import { Compass, MapPinned } from "lucide-react";
import { DestinationCard, TripCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listDestinations, listTrips } from "@/services/travel";

export const Route = createFileRoute("/travel/")({
  loader: async () => {
    const [destinations, trips] = await Promise.all([listDestinations(), listTrips()]);
    return { destinations, trips };
  },
  head: () =>
    seo({
      title: "Motorcycle Expeditions & Destinations | 36 Spokes",
      description:
        "Himalayan and Indian motorcycle expeditions: Ladakh, Spiti, Meghalaya and more, with dates, distances and seats.",
      socialDescription: "Fixed-departure motorcycle expeditions across India and the Himalaya.",
      path: "/travel",
    }),
  component: TravelPage,
});

function TravelPage() {
  const { destinations, trips } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Travel"
        title="Where will you ride next?"
        description="Small groups, real riding days and routes picked for the road surface as much as the view."
        image={media.destinations.ladakh}
      >
        <ButtonLink to="/rides" variant="outline">
          Prefer a short ride?
        </ButtonLink>
      </PageHeader>

      <Section>
        <SectionHeader
          eyebrow="Destinations"
          title="Choose a region"
          action={
            <ButtonLink to="/travel/destinations" variant="outline">
              All destinations
            </ButtonLink>
          }
        />
        {destinations.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            className="mt-10"
            title="Destinations are being scouted"
            description="New regions are published as routes are ridden and checked."
          />
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.slice(0, 6).map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        )}
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="Upcoming departures"
          title="Confirmed dates"
          action={
            <ButtonLink to="/travel/trips" variant="outline">
              All departures
            </ButtonLink>
          }
        />
        {trips.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="No departures published yet"
            description="New dates are published each season. Short rides run every weekend in the meantime."
            action={
              <ButtonLink to="/rides" variant="outline">
                Find a ride
              </ButtonLink>
            }
          />
        ) : (
          <Rail className="mt-10 md:grid-cols-2 lg:grid-cols-4">
            {trips.slice(0, 8).map((trip) => (
              <RailItem key={trip.id}>
                <TripCard trip={trip} />
              </RailItem>
            ))}
          </Rail>
        )}
      </Section>

      <Section>
        <div className="grid items-center gap-8 rounded-sm border border-border bg-card p-6 md:grid-cols-[auto_1fr_auto] md:p-10">
          <Compass className="size-10 text-primary" aria-hidden />
          <div>
            <p className="eyebrow">Plan your journey</p>
            <h2 className="mt-2 text-2xl sm:text-3xl">
              Build a route around your bike and your days
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Start with the journey planner today. A smarter travel planner that suggests routes,
              stops and timing is on the way.
            </p>
          </div>
          <ButtonLink to="/" hash="plan-your-journey" size="lg">
            Plan your journey
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
