import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { DepartureList } from "@/components/travel/DepartureList";
import { ButtonLink, DetailList, Section, SectionHeader } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getDestination, getTripBySlug } from "@/services/travel";

export const Route = createFileRoute("/travel/trips/$slug")({
  loader: async ({ params }) => {
    const trip = await getTripBySlug(params.slug);
    if (!trip) throw notFound();
    const destination = await getDestination(trip.destinationSlug);
    return { trip, destination };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.trip.name} | ${loaderData.trip.days}-Day Motorcycle Trip | 36 Spokes`,
          description: `${loaderData.trip.days} days and ${formatNumber(loaderData.trip.distanceKm)} km from ${loaderData.trip.startLocation}. ${loaderData.trip.difficulty} grade.`,
          path: `/travel/trips/${loaderData.trip.slug}`,
          image: loaderData.trip.image,
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="trip" backTo="/travel/trips" backLabel="All departures" />
  ),
  component: TripPage,
});

function TripPage() {
  const { trip, destination } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow={trip.destinationName}
        title={trip.name}
        description={`${trip.days} riding days and ${formatNumber(trip.distanceKm)} km, starting in ${trip.startLocation}.`}
        image={trip.image}
      >
        <ButtonLink to="/travel/trips" variant="outline">
          All departures
        </ButtonLink>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeader eyebrow="The trip" title="At a glance" />
            <DetailList
              size="md"
              className="mt-8"
              items={[
                { label: "Duration", value: `${trip.days} days` },
                { label: "Distance", value: `${formatNumber(trip.distanceKm)} km` },
                { label: "Starts", value: trip.startLocation },
                { label: "Grade", value: trip.difficulty },
                {
                  label: "Region",
                  value: destination ? (
                    <Link
                      to="/travel/$destination"
                      params={{ destination: destination.slug }}
                      className="hover:text-primary"
                    >
                      {destination.name}
                    </Link>
                  ) : (
                    trip.destinationName
                  ),
                },
              ]}
            />
          </div>
          <div>
            <SectionHeader eyebrow="Dates" title="Departures" />
            <div className="mt-8">
              <DepartureList departures={trip.departures} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Reserving a seat takes you to create your rider profile. Trip booking and payment
              aren't connected yet.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
