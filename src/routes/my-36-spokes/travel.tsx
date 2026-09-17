import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Bookmark, Map } from "lucide-react";
import { TripCard } from "@/components/cards";
import { BookingList } from "@/components/member/BookingList";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/travel")({
  head: () =>
    seo({
      title: "My Travel | My 36 Spokes",
      description: "Your trip bookings and the departures you've saved.",
      path: "/my-36-spokes/travel",
      noIndex: true,
    }),
  component: MemberTravelPage,
});

function MemberTravelPage() {
  const { bookings, savedTrips } = memberRoute.useLoaderData();

  return (
    <div>
      <MemberPageTitle
        title="My travel"
        description="Expeditions you've booked and departures you're considering."
      />
      <div className="space-y-4">
        <MemberPanel title="Bookings" headingLevel="h3">
          {bookings.length > 0 ? (
            <BookingList bookings={bookings} />
          ) : (
            <EmptyState
              icon={Map}
              className="mt-4"
              title="No trips booked yet"
              description="When you reserve a seat on a departure, the booking and its dates show up here."
              action={
                <ButtonLink to="/travel" variant="outline">
                  Explore trips
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>

        <MemberPanel title="Saved trips" headingLevel="h3">
          {savedTrips.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {savedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              className="mt-4"
              title="No saved trips"
              description="Save a departure to keep an eye on its dates and seats."
              action={
                <ButtonLink to="/travel/trips" variant="outline">
                  See departures
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>
      </div>
    </div>
  );
}
