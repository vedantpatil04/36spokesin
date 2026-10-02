import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";
import { RideCard } from "@/components/cards";
import { FeaturedRide } from "@/components/rides/FeaturedRide";
import { RideTypeFilter } from "@/components/rides/RideTypeFilter";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
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
  loader: async ({ deps }) => {
    const filter = deps.type ? { type: deps.type } : {};
    const [rides, pastRides] = await Promise.all([
      listRides(filter),
      listRides({ ...filter, when: "past" }),
    ]);
    return { rides, pastRides: pastRides.slice(0, 6), types: listRideTypes() };
  },
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
  const { rides, pastRides, types } = Route.useLoaderData();
  const { type } = Route.useSearch();
  // The lead ride: the one an admin featured, otherwise the next to leave.
  const lead = rides.find((ride) => ride.featured) ?? rides[0];
  const others = rides.filter((ride) => ride !== lead);

  return (
    <>
      <header className="border-b border-border">
        <div className="container-page py-8 md:py-14">
          <p className="eyebrow">Rides</p>
          <h1 className="mt-3 max-w-3xl text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">
            The road is better shared.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Day rides, weekenders and group rides led by 36 Spokes crews.
          </p>
        </div>
      </header>

      <Section labelledBy="upcoming-rides" className="py-10 md:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="upcoming-rides" className="text-xl sm:text-2xl">
            Upcoming rides
          </h2>
          <RideTypeFilter types={types} activeType={type} />
        </div>

        {lead === undefined ? (
          <EmptyState
            icon={RouteIcon}
            className="mt-6"
            title={type ? "No upcoming rides of this type" : "No upcoming rides yet"}
            description="Rides are posted by crews through the week. Check back soon or try another type."
            action={
              <ButtonLink to="/rides" search={{}} variant="outline">
                Show all rides
              </ButtonLink>
            }
          />
        ) : (
          <>
            <div className="mt-6">
              <FeaturedRide ride={lead} />
            </div>
            {others.length > 0 ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            ) : null}
          </>
        )}
      </Section>

      {pastRides.length > 0 ? (
        <Section labelledBy="past-rides" className="pb-10 pt-0 md:pb-14 md:pt-0">
          <h2 id="past-rides" className="text-xl sm:text-2xl">
            Past rides
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="surface">
        <div className="flex flex-col items-center justify-between gap-6 rounded-sm border border-border bg-card p-8 md:flex-row md:p-12">
          <div className="max-w-xl">
            <span className="font-display text-xs uppercase tracking-[0.2em] text-primary">
              JOURNEY PLANNING & BLUEPRINTS
            </span>
            <h3 className="mt-2 font-display text-2xl uppercase text-foreground md:text-3xl">
              Planning a long solo or multi-day expedition?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Calculate fuel range, altitude acclimatization, daily halts, and stays tailored to
              your machine in the dedicated 36 Spokes Journey Planner.
            </p>
          </div>
          <ButtonLink to="/plan" size="lg" className="shrink-0">
            Open Journey Planner
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
