import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { RouteMapPlaceholder } from "@/components/rides/RouteMapPlaceholder";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { ButtonLink, DetailList, Section, SectionHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { getRideBySlug } from "@/services/rides";

export const Route = createFileRoute("/rides/$slug")({
  loader: async ({ params }) => {
    const ride = await getRideBySlug(params.slug);
    if (!ride) throw notFound();
    return { ride };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.ride.name}: ${loaderData.ride.route.distanceKm} km from ${loaderData.ride.location} | 36 Spokes`,
          description: loaderData.ride.summary,
          path: `/rides/${loaderData.ride.slug}`,
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => <EntityNotFound entity="ride" backTo="/rides" backLabel="All rides" />,
  component: RidePage,
});

function RidePage() {
  const { ride } = Route.useLoaderData();
  const stops = [ride.route.start, ...ride.route.waypoints, ride.route.finish];

  return (
    <>
      <PageHeader
        eyebrow={`${ride.type}, ${ride.location}`}
        title={ride.name}
        description={ride.summary}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/join" size="lg">
            Join this ride
          </ButtonLink>
          <ButtonLink to="/rides" variant="outline" size="lg">
            All rides
          </ButtonLink>
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader eyebrow="The ride" title="What to expect" />
            <DetailList
              size="md"
              className="mt-8"
              items={[
                { label: "Distance", value: `${ride.route.distanceKm} km` },
                { label: "Duration", value: ride.duration },
                { label: "Difficulty", value: ride.difficulty },
                { label: "Riders", value: String(ride.riders) },
              ]}
            />
            <div className="mt-8 rounded-sm border border-border bg-card p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                Meeting point
              </p>
              <p className="mt-2 text-sm text-foreground">{ride.meetingPoint}</p>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Route" title="The road" />
            <ol
              aria-label="Route stops"
              className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              {stops.map((stop, index) => (
                <li key={`${stop}-${index}`} className="flex items-center gap-3">
                  {index > 0 ? <span aria-hidden className="h-px w-5 bg-primary/70" /> : null}
                  <span
                    className={
                      index === 0 || index === stops.length - 1
                        ? "font-display text-sm uppercase tracking-[0.14em] text-foreground"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {stop}
                  </span>
                </li>
              ))}
            </ol>
            <RouteMapPlaceholder className="mt-8" label="Route map arrives in a later phase" />
          </div>
        </div>
      </Section>
    </>
  );
}
