import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";
import { RideCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { RideTypeFilter } from "@/components/rides/RideTypeFilter";
import { RouteMapPlaceholder } from "@/components/rides/RouteMapPlaceholder";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section, SectionHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listRideTypes, listRides, parseRideTypeSlug } from "@/services/rides";
import type { RideTypeSlug } from "@/types";

type RidesSearch = { type?: RideTypeSlug };

export const Route = createFileRoute("/rides/")({
  // Filters live in the URL so a filtered list can be shared and survives reloads.
  validateSearch: (search: Record<string, unknown>): RidesSearch => {
    const type = parseRideTypeSlug(search["type"]);
    return type ? { type } : {};
  },
  loaderDeps: ({ search }) => ({ type: search.type }),
  loader: async ({ deps }) => ({
    rides: await listRides(deps.type ? { type: deps.type } : {}),
    types: listRideTypes(),
  }),
  head: () =>
    seo({
      title: "Weekend Rides, Day Loops & Rider Meets | 36 Spokes",
      description:
        "Discover weekend rides, day loops, group rides and meets, with distance, duration and difficulty.",
      socialDescription: "Find your next ride and plan a route with other riders.",
      path: "/rides",
    }),
  component: RidesPage,
});

function RidesPage() {
  const { rides, types } = Route.useLoaderData();
  const { type } = Route.useSearch();

  return (
    <>
      <PageHeader
        eyebrow="Rides"
        title="Find your next ride"
        description="Short rides, weekenders and meets posted by riders. Route planning and maps arrive in a later phase."
      >
        <ButtonLink to="/" hash="plan-your-journey" size="lg">
          Plan a ride
        </ButtonLink>
      </PageHeader>

      <Section>
        <RideTypeFilter types={types} activeType={type} />

        {rides.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            className="mt-8"
            title="No rides of this type right now"
            description="Rides are posted by crews through the week. Try another type or see everything on the calendar."
            action={
              <ButtonLink to="/rides" search={{}} variant="outline">
                Show all rides
              </ButtonLink>
            }
          />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="Coming next"
          title="Route planning"
          description="A map-based route builder with waypoints, fuel stops and elevation will live here. It loads only when opened."
        />
        <RouteMapPlaceholder className="mt-8" />
      </Section>
    </>
  );
}
