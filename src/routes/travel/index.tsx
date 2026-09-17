import { createFileRoute } from "@tanstack/react-router";
import { DestinationCard, TripCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
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
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard key={destination.slug} destination={destination} />
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="Upcoming departures"
          title="Confirmed dates"
          description="Seat counts shown are placeholder development content."
          action={
            <ButtonLink to="/travel/trips" variant="outline">
              All departures
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-2 lg:grid-cols-4">
          {trips.map((trip) => (
            <RailItem key={trip.id}>
              <TripCard trip={trip} />
            </RailItem>
          ))}
        </Rail>
      </Section>
    </>
  );
}
