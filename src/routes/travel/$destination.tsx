import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { TripCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, EntityNotFound, PageSkeleton } from "@/components/states";
import { Badge, ButtonLink, Section, SectionHeader } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getDestination, listTrips } from "@/services/travel";

export const Route = createFileRoute("/travel/$destination")({
  loader: async ({ params }) => {
    const destination = await getDestination(params.destination);
    if (!destination) throw notFound();
    const trips = await listTrips({ destinationSlug: destination.slug });
    return { destination, trips };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.destination.name} Motorcycle Expeditions | 36 Spokes`,
          description: `${loaderData.destination.descriptor} ${loaderData.destination.days}-day trips from ${formatINR(loaderData.destination.startingPrice)}.`,
          path: `/travel/${loaderData.destination.slug}`,
          image: loaderData.destination.image,
        })
      : {},
  pendingComponent: () => <PageSkeleton />,
  notFoundComponent: () => (
    <EntityNotFound
      entity="destination"
      backTo="/travel/destinations"
      backLabel="All destinations"
    />
  ),
  component: DestinationPage,
});

function DestinationPage() {
  const { destination, trips } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow={destination.region}
        title={destination.name}
        description={destination.descriptor}
        image={destination.image}
      >
        <ul className="flex flex-wrap items-center gap-2" aria-label="Trip overview">
          <li>
            <Badge>{destination.days} days</Badge>
          </li>
          <li>
            <Badge>{destination.difficulty}</Badge>
          </li>
          <li>
            <Badge tone="primary">From {formatINR(destination.startingPrice)}</Badge>
          </li>
        </ul>
      </PageHeader>

      <Section>
        <SectionHeader
          eyebrow="Departures"
          title={`Ride ${destination.name} with us`}
          action={
            <ButtonLink to="/travel/destinations" variant="outline">
              Other destinations
            </ButtonLink>
          }
        />
        {trips.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            className="mt-10"
            title={`No ${destination.name} departures scheduled yet`}
            description="Dates for this region are being finalised. Confirmed trips elsewhere are open now."
            action={
              <ButtonLink to="/travel/trips" variant="outline">
                See all departures
              </ButtonLink>
            }
          />
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
