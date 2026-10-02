import { createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { TripCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { EmptyState, EntityNotFound, PageSkeleton } from "@/components/states";
import { LinkedRides } from "@/components/travel/LinkedRides";
import { Paragraphs } from "@/components/travel/Paragraphs";
import { Badge, ButtonLink, DetailList, Section, SectionHeader } from "@/components/ui-kit";
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
          description:
            loaderData.destination.descriptor ||
            `Motorcycle trips to ${loaderData.destination.name}, ${loaderData.destination.region}.`,
          path: `/travel/${loaderData.destination.slug}`,
          ...(loaderData.destination.hasImage ? { image: loaderData.destination.image } : {}),
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
  const facts = [
    { label: "Region", value: `${destination.region}, ${destination.country}` },
    { label: "Difficulty", value: destination.difficulty },
    ...(destination.duration ? [{ label: "Recommended", value: destination.duration }] : []),
    ...(destination.bestSeason ? [{ label: "Best season", value: destination.bestSeason }] : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow={destination.region}
        title={destination.name}
        description={destination.descriptor}
        {...(destination.hasImage ? { image: destination.image } : {})}
      >
        <ul className="flex flex-wrap items-center gap-2" aria-label="Destination overview">
          {destination.duration ? (
            <li>
              <Badge>{destination.duration}</Badge>
            </li>
          ) : null}
          <li>
            <Badge>{destination.difficulty}</Badge>
          </li>
          {destination.startingPrice !== null ? (
            <li>
              <Badge tone="primary">From {formatINR(destination.startingPrice)}</Badge>
            </li>
          ) : null}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink to="/travel/trips" size="lg">
            Explore trips
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
          <div>
            <SectionHeader eyebrow="The region" title={`Riding ${destination.name}`} />
            {destination.description ? (
              <Paragraphs text={destination.description} className="mt-8" />
            ) : (
              <p className="mt-8 text-muted-foreground">{destination.descriptor}</p>
            )}
            {destination.images.length > 0 ? (
              <div className="mt-10">
                <ProductGallery
                  images={destination.images}
                  fallback={destination.image}
                  productName={destination.name}
                />
              </div>
            ) : null}
          </div>
          <div>
            <SectionHeader eyebrow="Plan" title="Useful information" />
            <DetailList size="md" className="mt-8" items={facts} />
            {destination.usefulInfo ? (
              <Paragraphs text={destination.usefulInfo} className="mt-6 text-sm" />
            ) : null}
            {destination.rides.length > 0 ? (
              <div className="mt-10">
                <h3 className="text-lg">Upcoming rides</h3>
                <div className="mt-4">
                  <LinkedRides rides={destination.rides} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      <Section tone="surface">
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
