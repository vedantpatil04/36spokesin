import { Link, createFileRoute } from "@tanstack/react-router";
import { MemberPageTitle } from "@/components/member/MemberPanel";
import { ErrorState, Skeleton } from "@/components/states";
import { Badge, type BadgeTone, ButtonLink } from "@/components/ui-kit";
import { useMyRides } from "@/hooks/use-my-rides";
import {
  BOOKING_STATUS_LABEL,
  formatRideDate,
  formatRideTime,
  rideDestination,
} from "@/lib/ride-format";
import { seo } from "@/lib/seo";
import type { MyRide } from "@/types";

export const Route = createFileRoute("/my-36-spokes/rides")({
  head: () =>
    seo({
      title: "My Rides | My 36 Spokes",
      description: "Your ride bookings: what's coming up and what you've ridden.",
      path: "/my-36-spokes/rides",
      noIndex: true,
    }),
  component: MemberRidesPage,
});

/**
 * A booking is upcoming while it holds a seat (confirmed, or waiting on its
 * payment) on a ride that hasn't started.
 */
const isUpcoming = (entry: MyRide, now: number) =>
  entry.status !== "cancelled" &&
  entry.ride.status !== "completed" &&
  new Date(entry.ride.startsAt).getTime() > now;

function MemberRidesPage() {
  const myRides = useMyRides();
  const now = Date.now();
  const bookings = myRides.data ?? [];
  const upcoming = bookings.filter((entry) => isUpcoming(entry, now));
  // Rides already ridden and cancelled bookings, most recent ride first.
  const past = bookings.filter((entry) => !isUpcoming(entry, now)).reverse();

  return (
    <div>
      <MemberPageTitle title="My rides" description="Your bookings, straight from the ride list." />

      {myRides.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : myRides.isError ? (
        <ErrorState title="Your rides didn't load" onRetry={() => void myRides.refetch()} />
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="my-rides-upcoming">
            <h3 id="my-rides-upcoming" className="text-lg">
              Upcoming
            </h3>
            {upcoming.length > 0 ? (
              <div className="mt-4 space-y-3">
                {upcoming.map((entry) => (
                  <BookingRow key={entry.bookingNumber} entry={entry} upcoming />
                ))}
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                <p className="text-sm text-muted-foreground">No upcoming rides.</p>
                <ButtonLink to="/rides" variant="outline" size="sm">
                  Find a ride
                </ButtonLink>
              </div>
            )}
          </section>

          {past.length > 0 ? (
            <section aria-labelledby="my-rides-past">
              <h3 id="my-rides-past" className="text-lg">
                Past
              </h3>
              <div className="mt-4 space-y-3">
                {past.map((entry) => (
                  <BookingRow key={entry.bookingNumber} entry={entry} upcoming={false} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

const STATUS_TONE: Record<MyRide["status"], BadgeTone> = {
  "payment-required": "warning",
  "payment-under-review": "primary",
  "payment-rejected": "warning",
  confirmed: "success",
  cancelled: "warning",
};

/** One booking: the ride, when and where, the booking ID and its status. */
function BookingRow({ entry, upcoming }: { entry: MyRide; upcoming: boolean }) {
  const { ride } = entry;
  const destination = rideDestination(ride);
  const awaitingPayment =
    entry.status === "payment-required" || entry.status === "payment-rejected";
  // The organisers calling a ride off outranks the rider's own booking status.
  const rideCalledOff = ride.status === "cancelled" && entry.status !== "cancelled";
  const badge: { tone: BadgeTone; label: string } = rideCalledOff
    ? { tone: "warning", label: "Ride cancelled" }
    : {
        tone: upcoming ? STATUS_TONE[entry.status] : "neutral",
        label: BOOKING_STATUS_LABEL[entry.status],
      };
  const facts = [
    { label: "Date", value: formatRideDate(ride.startsAt) },
    { label: "Departure", value: formatRideTime(ride.startsAt) },
    { label: "Meeting point", value: ride.meetingPoint },
    { label: "Booking ID", value: entry.reference },
  ];

  return (
    <article className="rounded-sm border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h4 className="text-lg leading-tight">
            <Link to="/rides/$slug" params={{ slug: ride.slug }} className="hover:text-primary">
              {ride.name}
            </Link>
          </h4>
          {destination ? (
            <p className="mt-1 font-display text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {destination}
            </p>
          ) : null}
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              {fact.label}
            </dt>
            <dd className="mt-1 text-sm text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        <ButtonLink to="/rides/$slug" params={{ slug: ride.slug }} size="sm">
          View ride
        </ButtonLink>
        {upcoming ? (
          <ButtonLink
            to="/rides/$slug/book"
            params={{ slug: ride.slug }}
            variant="outline"
            size="sm"
          >
            {awaitingPayment ? "Complete payment" : "Booking details"}
          </ButtonLink>
        ) : null}
      </div>
    </article>
  );
}
