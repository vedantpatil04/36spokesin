import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Bookmark, Route as RouteIcon } from "lucide-react";
import { RideCard } from "@/components/cards";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/rides")({
  head: () =>
    seo({
      title: "My Rides | My 36 Spokes",
      description: "Rides you've joined and routes you've saved.",
      path: "/my-36-spokes/rides",
      noIndex: true,
    }),
  component: MemberRidesPage,
});

function MemberRidesPage() {
  const { upcomingRide, savedRides } = memberRoute.useLoaderData();

  return (
    <div>
      <MemberPageTitle
        title="My rides"
        description="Rides you've joined and routes you've saved."
      />
      <div className="space-y-4">
        <MemberPanel title="Joined" headingLevel="h3">
          {upcomingRide ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <RideCard ride={upcomingRide} />
            </div>
          ) : (
            <EmptyState
              icon={RouteIcon}
              className="mt-4"
              title="You haven't joined a ride yet"
              description="Day loops and weekenders near you are posted every week."
              action={
                <ButtonLink to="/rides" variant="outline">
                  Find a ride
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>

        <MemberPanel title="Saved" headingLevel="h3">
          {savedRides.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {savedRides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Bookmark}
              className="mt-4"
              title="No saved rides yet"
              description="Save a ride to come back to its route and meeting point later."
              action={
                <ButtonLink to="/rides" variant="outline">
                  Browse rides
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>
      </div>
    </div>
  );
}
