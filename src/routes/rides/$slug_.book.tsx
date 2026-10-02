import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { RideBookingForm } from "@/components/rides/RideBookingForm";
import { RideBookingSummary } from "@/components/rides/RideBookingSummary";
import { RidePaymentPanel } from "@/components/rides/RidePaymentPanel";
import { EntityNotFound, ErrorState, PageSkeleton } from "@/components/states";
import { Badge, ButtonLink } from "@/components/ui-kit";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  formatRideDate,
  formatRidePrice,
  formatRideTime,
  rideAvailability,
  rideDestination,
  rideSeats,
} from "@/lib/ride-format";
import { seo } from "@/lib/seo";
import { getRideBySlug, getRideRegistration } from "@/services/rides";
import { useAuthStatus, useAuthUser } from "@/state/auth";
import type { RideRegistration } from "@/types";

/**
 * Booking for one ride: the form, then for a paid ride the payment step (UPI
 * details, proof upload, review status), then the rider's booking as the API
 * stores it (booking ID, status, cancel). A cancelled booking stays visible as history
 * with the form to book again. Signed-in riders only; the guard runs after hydration because the
 * session lives in an httpOnly cookie the SSR loader can't read (see
 * my-36-spokes/route.tsx). Signed-out visitors are sent to log in and returned
 * here.
 */
export const Route = createFileRoute("/rides/$slug_/book")({
  loader: async ({ params }) => {
    const ride = await getRideBySlug(params.slug);
    if (!ride) throw notFound();
    return { ride };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `Book ${loaderData.ride.name} | 36 Spokes Rides`,
          description: `Reserve your spot on ${loaderData.ride.name}.`,
          noIndex: true,
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => <EntityNotFound entity="ride" backTo="/rides" backLabel="All rides" />,
  component: BookRidePage,
});

function BookRidePage() {
  const { ride } = Route.useLoaderData();
  const status = useAuthStatus();
  const user = useAuthUser();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingKey = ["ride-registration", ride.id, user?.id];
  const registration = useQuery({
    queryKey: bookingKey,
    queryFn: () => getRideRegistration(ride.id),
    enabled: hydrated && Boolean(user),
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      void navigate({
        to: "/login",
        search: { redirect: `/rides/${ride.slug}/book` },
        replace: true,
      });
    }
  }, [status, navigate, ride.slug]);

  // What just happened on this page, for the heading only; the booking itself is the API's.
  const [event, setEvent] = useState<"booked" | "already-booked" | null>(null);

  /** Shows what the API saved at once, then refreshes seat counts and My Rides. */
  const onChanged = (booking: RideRegistration) => {
    queryClient.setQueryData(bookingKey, booking);
    void queryClient.invalidateQueries({ queryKey: ["my-rides"] });
    void router.invalidate();
    window.scrollTo({ top: 0 });
  };

  if (!hydrated || status !== "authenticated" || !user || registration.isPending) {
    return <PageSkeleton layout="detail" />;
  }

  const destination = rideDestination(ride);
  const booking = registration.data;
  const holdsSeat = Boolean(booking?.status) && booking?.status !== "cancelled";
  const availability = rideAvailability(ride);
  const closedReason = availability === "Full" ? "Sold out" : availability;
  const summary = [
    { label: "Date", value: formatRideDate(ride.startsAt) },
    { label: "Departure", value: formatRideTime(ride.startsAt) },
    { label: "Meeting point", value: ride.meetingPoint },
    { label: "Price", value: formatRidePrice(ride) },
    // Once the rider holds a seat, how many are left is no longer their question.
    ...(holdsSeat ? [] : [{ label: "Availability", value: rideSeats(ride) }]),
  ];

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        to="/rides/$slug"
        params={{ slug: ride.slug }}
        className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to the ride
      </Link>

      <div className="mt-5 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="max-w-xl">
          {registration.isError || !booking ? (
            <ErrorState
              title="Your booking didn't load"
              description="We couldn't check whether you already hold a spot on this ride."
              onRetry={() => void registration.refetch()}
            />
          ) : booking.status !== null &&
            booking.status !== "confirmed" &&
            booking.status !== "cancelled" ? (
            <RidePaymentPanel
              ride={ride}
              booking={booking}
              onChanged={(changed) => {
                setEvent(null);
                onChanged(changed);
              }}
              onStale={() => void registration.refetch()}
            />
          ) : booking.registered ? (
            <RideBookingSummary
              ride={ride}
              booking={booking}
              user={user}
              heading={
                event === "booked"
                  ? "You're booked"
                  : event === "already-booked"
                    ? "You're already booked"
                    : "Your booking"
              }
              onCancelled={(cancelled) => {
                setEvent(null);
                onChanged(cancelled);
              }}
              onStale={() => void registration.refetch()}
            />
          ) : (
            <>
              {booking.status === "cancelled" ? (
                <div className="mb-8 rounded-sm border border-border bg-surface/60 p-4">
                  <Badge tone="warning">
                    {booking.holdExpired ? "Seat hold ran out" : "Cancelled"}
                  </Badge>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Booking{" "}
                    <span className="font-display text-foreground">{booking.reference}</span>{" "}
                    {booking.holdExpired
                      ? "was released because no payment proof arrived in time"
                      : "was cancelled"}
                    {booking.cancelledAt ? ` on ${formatRideDate(booking.cancelledAt)}` : ""}. Your
                    seat was released.
                  </p>
                </div>
              ) : null}
              {ride.registrationOpen ? (
                <>
                  <p className="eyebrow">Reserve your spot</p>
                  <h1 className="mt-3 text-3xl leading-[1.05] sm:text-4xl">
                    {booking.status === "cancelled" ? "Book again" : "Book this ride"}
                  </h1>
                  <div className="mt-6">
                    <RideBookingForm
                      ride={ride}
                      user={user}
                      onBooked={(booked) => {
                        setEvent("booked");
                        onChanged(booked);
                      }}
                      onAlreadyBooked={() => {
                        setEvent("already-booked");
                        void registration.refetch();
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl leading-[1.05] sm:text-4xl">Booking is closed</h1>
                  <p className="mt-3 text-base text-muted-foreground">
                    {ride.name} isn't taking bookings: {closedReason.toLowerCase()}.
                  </p>
                  <ButtonLink to="/rides" variant="outline" className="mt-6">
                    See other rides
                  </ButtonLink>
                </>
              )}
            </>
          )}
        </div>

        <aside
          aria-label="Ride summary"
          // On a phone the ride comes first while booking, and after the confirmation once booked.
          className={`rounded-sm border border-border bg-card p-5 sm:p-6 lg:col-start-2 lg:row-start-1 lg:self-start ${
            holdsSeat ? "" : "order-first lg:order-none"
          }`}
        >
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{ride.type}</p>
          <p className="mt-2 font-display text-xl uppercase leading-tight text-foreground">
            {ride.name}
          </p>
          {destination ? (
            <p className="mt-1 font-display text-sm uppercase tracking-[0.14em] text-muted-foreground">
              {destination}
            </p>
          ) : null}
          <dl className="mt-5 space-y-3 border-t border-border pt-5">
            {summary.map((item) => (
              <div key={item.label} className="flex items-baseline justify-between gap-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="text-right font-display text-sm uppercase text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
