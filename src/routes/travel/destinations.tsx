import { createFileRoute } from "@tanstack/react-router";
import { MapPinned } from "lucide-react";
import { DestinationCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listDestinations } from "@/services/travel";

export const Route = createFileRoute("/travel/destinations")({
  loader: async () => ({ destinations: await listDestinations() }),
  head: () =>
    seo({
      title: "Motorcycle Touring Destinations in India & the Himalaya | 36 Spokes",
      description:
        "Every region 36 Spokes rides: Ladakh, Spiti, Meghalaya, Rajasthan, Nepal and Bhutan, with trip length, grade and starting price.",
      path: "/travel/destinations",
    }),
  component: DestinationsPage,
});

function DestinationsPage() {
  const { destinations } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Travel"
        title="Destinations"
        description="Regions we ride, with the typical trip length, how hard the roads are and what a place on the trip starts at."
      >
        <ButtonLink to="/travel/trips" variant="outline">
          See confirmed departures
        </ButtonLink>
      </PageHeader>
      <Section>
        {destinations.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="No destinations listed yet"
            description="New regions are added as routes are scouted."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard key={destination.slug} destination={destination} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
