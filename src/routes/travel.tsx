import { createFileRoute } from "@tanstack/react-router";
import { ButtonLink, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { DestinationCard, TripCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { destinations, media, trips } from "@/data/content";

export const Route = createFileRoute("/travel")({
  head: () => ({
    meta: [
      { title: "Motorcycle Expeditions & Destinations | 36 Spokes" },
      {
        name: "description",
        content:
          "Himalayan and Indian motorcycle expeditions: Ladakh, Spiti, Meghalaya and more, with dates, distances and seats.",
      },
      { property: "og:title", content: "Motorcycle Expeditions & Destinations | 36 Spokes" },
      { property: "og:description", content: "Fixed-departure motorcycle expeditions across India and the Himalaya." },
    ],
  }),
  component: TravelPage,
});

function TravelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Travel"
        title="Where will you ride next?"
        description="Small groups, real riding days and routes picked for the road surface as much as the view."
        image={media.destLadakh}
        imageAlt="Snow-lined mountain road with prayer flags in Ladakh"
      >
        <ButtonLink to="/rides" variant="outline">
          Prefer a short ride?
        </ButtonLink>
      </PageHeader>

      <Section>
        <SectionHeader eyebrow="Destinations" title="Choose a region" />
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
