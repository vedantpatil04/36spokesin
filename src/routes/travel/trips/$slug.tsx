import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { EmptyState, EntityNotFound, PageSkeleton } from "@/components/states";
import { DepartureList } from "@/components/travel/DepartureList";
import { LinkedRides } from "@/components/travel/LinkedRides";
import { Paragraphs } from "@/components/travel/Paragraphs";
import { ButtonLink, DetailList, Section, SectionHeader } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getTripBySlug } from "@/services/travel";

export const Route = createFileRoute("/travel/trips/$slug")({
  loader: async ({ params }) => {
    const trip = await getTripBySlug(params.slug);
    if (!trip) throw notFound();
    return { trip };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.trip.name} | ${loaderData.trip.days}-Day Motorcycle Trip | 36 Spokes`,
          description:
            loaderData.trip.summary ||
            `${loaderData.trip.days} days from ${loaderData.trip.startLocation}. ${loaderData.trip.difficulty} grade.`,
          path: `/travel/trips/${loaderData.trip.slug}`,
          ...(loaderData.trip.hasImage ? { image: loaderData.trip.image } : {}),
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="trip" backTo="/travel/trips" backLabel="All departures" />
  ),
  component: TripPage,
});

function TripPage() {
  const { trip } = Route.useLoaderData();
  const distance = trip.distanceKm !== null ? ` and ${formatNumber(trip.distanceKm)} km` : "";

  return (
    <>
      <PageHeader
        eyebrow={trip.destinationName}
        title={trip.name}
        description={
          trip.summary || `${trip.days} riding days${distance}, starting in ${trip.startLocation}.`
        }
        {...(trip.hasImage ? { image: trip.image } : {})}
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
                ...(trip.distanceKm !== null
                  ? [{ label: "Distance", value: `${formatNumber(trip.distanceKm)} km` }]
                  : []),
                { label: "Starts", value: trip.startLocation },
                ...(trip.endLocation ? [{ label: "Ends", value: trip.endLocation }] : []),
                { label: "Grade", value: trip.difficulty },
                {
                  label: "Region",
                  value: (
                    <Link
                      to="/travel/$destination"
                      params={{ destination: trip.destinationSlug }}
                      className="hover:text-primary"
                    >
                      {trip.destinationName}
                    </Link>
                  ),
                },
              ]}
            />
            {trip.description ? (
              <Paragraphs text={trip.description} className="mt-8 text-sm" />
            ) : null}
          </div>
          <div>
            <SectionHeader eyebrow="Dates" title="Departures" />
            <div className="mt-8">
              {trip.departures.length > 0 ? (
                <DepartureList departures={trip.departures} />
              ) : (
                <EmptyState
                  icon={CalendarClock}
                  title="No dates scheduled yet"
                  description="New departures are published each season."
                />
              )}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Reserving a seat takes you to create your rider profile. Trip booking and payment
              aren't connected yet.
            </p>
          </div>
        </div>
      </Section>

      {trip.itinerary.length > 0 ? (
        <Section tone="surface">
          <SectionHeader eyebrow="Itinerary" title="Day by day" />
          <ol className="mt-10 grid gap-4 md:grid-cols-2">
            {trip.itinerary.map((day) => (
              <li key={day.id} className="rounded-sm border border-border bg-card p-5">
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-primary">
                  Day {day.dayNumber}
                </p>
                <h3 className="mt-2 text-xl leading-tight">{day.title}</h3>
                {day.routeSummary || day.distanceKm !== null ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {[
                      day.routeSummary,
                      day.distanceKm !== null ? `${formatNumber(day.distanceKm)} km` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                {day.description ? (
                  <Paragraphs text={day.description} className="mt-3 text-sm" />
                ) : null}
                {day.accommodation ? (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Stay: </span>
                    {day.accommodation}
                  </p>
                ) : null}
                {day.notes ? (
                  <p className="mt-2 text-xs text-muted-foreground">{day.notes}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {trip.images.length > 0 || trip.rides.length > 0 ? (
        <Section>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            {trip.images.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Photos" title="On the road" />
                <div className="mt-8">
                  <ProductGallery
                    images={trip.images}
                    fallback={trip.image}
                    productName={trip.name}
                  />
                </div>
              </div>
            ) : (
              <div />
            )}
            {trip.rides.length > 0 ? (
              <div>
                <SectionHeader eyebrow="Warm up" title="Related rides" />
                <div className="mt-8">
                  <LinkedRides rides={trip.rides} />
                </div>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}
    </>
  );
}
