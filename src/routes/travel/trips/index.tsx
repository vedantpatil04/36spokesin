import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { TripCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listTrips } from "@/services/travel";

export const Route = createFileRoute("/travel/trips/")({
  loader: async () => ({ trips: await listTrips() }),
  head: () =>
    seo({
      title: "Upcoming Motorcycle Trip Departures | 36 Spokes",
      description:
        "Confirmed 36 Spokes expedition dates with distance, grade, starting point and seats left.",
      path: "/travel/trips",
    }),
  component: TripsPage,
});

function TripsPage() {
  const { trips } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Travel"
        title="Upcoming departures"
        description="Every confirmed date, soonest first. Seat counts shown are placeholder development content."
      >
        <ButtonLink to="/travel/destinations" variant="outline">
          Browse by destination
        </ButtonLink>
      </PageHeader>
      <Section>
        {trips.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No departures scheduled"
            description="New dates are published each season. Short rides run every weekend in the meantime."
            action={
              <ButtonLink to="/rides" variant="outline">
                Find a ride
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
