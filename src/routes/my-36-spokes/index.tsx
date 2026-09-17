import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { RideCard, TripCard } from "@/components/cards";
import { SetupChecklist } from "@/components/garage/SetupChecklist";
import { GarageBikeCard } from "@/components/member/GarageBikeCard";
import { MemberPanel } from "@/components/member/MemberPanel";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { formatCompactDateRange } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { seo } from "@/lib/seo";
import { listProducts } from "@/services/catalog";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/")({
  loader: async () => ({ recommended: (await listProducts()).slice(0, 4) }),
  head: () =>
    seo({
      title: "My 36 Spokes | Rider Dashboard",
      description:
        "Your motorcycle, gear, rides, routes, trips, bookings and orders in one rider dashboard.",
      socialDescription: "Your bike, gear, rides and trips in one place.",
      path: "/my-36-spokes",
      noIndex: true,
    }),
  component: Dashboard,
});

function Dashboard() {
  const { recommended } = Route.useLoaderData();
  const member = memberRoute.useLoaderData();
  const { primaryBike, upcomingRide, upcomingBooking } = member;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {primaryBike ? (
          <GarageBikeCard garageBike={primaryBike} />
        ) : (
          <EmptyState
            icon={Wrench}
            title="No motorcycle added yet"
            description="Add your bike to see gear matched to it and its service status."
          />
        )}

        <div className="grid gap-4">
          <article className="rounded-sm border border-border bg-card p-5">
            <p className="eyebrow">Upcoming ride</p>
            {upcomingRide ? (
              <>
                <h2 className="mt-2 text-xl">{upcomingRide.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {upcomingRide.location} <span aria-hidden>·</span> {upcomingRide.route.distanceKm}{" "}
                  km <span aria-hidden>·</span> {upcomingRide.duration}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No rides joined yet.</p>
            )}
          </article>
          <article className="rounded-sm border border-border bg-card p-5">
            <p className="eyebrow">Upcoming trip</p>
            {upcomingBooking ? (
              <>
                <h2 className="mt-2 text-xl">{upcomingBooking.trip.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCompactDateRange(
                    upcomingBooking.departure.startDate,
                    upcomingBooking.departure.endDate,
                  )}{" "}
                  <span aria-hidden>·</span> {formatINR(upcomingBooking.departure.price)}{" "}
                  <span aria-hidden>·</span> {upcomingBooking.departure.seatsLeft} seats left
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No trips booked yet.</p>
            )}
          </article>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MemberPanel title="Setup readiness">
          {member.setupChecklist.length > 0 ? (
            <SetupChecklist items={member.setupChecklist} variant="compact" />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Your trip-readiness checklist will appear here once it's connected to your gear.
            </p>
          )}
        </MemberPanel>

        <MemberPanel title="Recent activity">
          {member.activity.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {member.activity.map((item) => (
                <li key={item.id}>{item.label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Rides you join, gear you order and trips you enquire about show up here.
            </p>
          )}
        </MemberPanel>
      </div>

      <section>
        <h2 className="mb-4 text-lg">Recommended gear for your bike</h2>
        <ProductGrid
          products={recommended}
          {...(primaryBike ? { bikeId: primaryBike.bikeId } : {})}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg">Saved rides & trips</h2>
        {member.savedRides.length + member.savedTrips.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {member.savedRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
            {member.savedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing saved yet"
            description="Save rides and trips you're considering and they'll wait for you here."
            action={
              <ButtonLink to="/rides" variant="outline">
                Find a ride
              </ButtonLink>
            }
          />
        )}
      </section>
    </div>
  );
}
