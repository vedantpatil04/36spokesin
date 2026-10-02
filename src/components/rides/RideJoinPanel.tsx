import { useQuery } from "@tanstack/react-query";
import { Check, Clock } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui-kit";
import { useHydrated } from "@/hooks/use-hydrated";
import { BOOKING_STATUS_LABEL, rideAvailability } from "@/lib/ride-format";
import { getRideRegistration } from "@/services/rides";
import { useAuthStatus, useAuthUser } from "@/state/auth";
import type { Ride } from "@/types";

/**
 * The ride page's booking state for whoever is looking, straight from the API:
 * not booked (reserve), booked (booking ID, view it), waiting on payment
 * (complete it or see the review), cancelled (book again) or sold out. Booking,
 * paying and cancelling happen on the booking page, which asks signed-out
 * riders to log in first; everyone can read the ride without an account.
 */
export function RideJoinPanel({ ride }: { ride: Ride }) {
  const status = useAuthStatus();
  const user = useAuthUser();
  // Auth resolves in the browser only, so the server render never knows it.
  const hydrated = useHydrated();
  const signedIn = hydrated && Boolean(user);
  const registration = useQuery({
    queryKey: ["ride-registration", ride.id, user?.id],
    queryFn: () => getRideRegistration(ride.id),
    enabled: signedIn,
  });
  const booking = registration.data;
  const availability = rideAvailability(ride);
  const state = booking?.status ?? null;
  const awaitingRider = state === "payment-required" || state === "payment-rejected";

  return (
    <div>
      {signedIn && registration.isPending ? (
        // Never offer "Reserve" to a rider whose booking simply hasn't loaded yet.
        <Button size="lg" className="w-full" disabled>
          Checking your booking
        </Button>
      ) : booking && state === "confirmed" ? (
        <>
          <div className="rounded-sm border border-success/50 px-4 py-3">
            <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.14em] text-success">
              <Check className="size-4" aria-hidden />
              Booked
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Booking ID <span className="font-display text-foreground">{booking.reference}</span>
            </p>
          </div>
          <ButtonLink
            to="/rides/$slug/book"
            params={{ slug: ride.slug }}
            variant="outline"
            size="lg"
            className="mt-3 w-full"
          >
            View my ride
          </ButtonLink>
        </>
      ) : booking && state !== null && state !== "cancelled" ? (
        // A paid booking whose seat is held until the payment is verified.
        <>
          <div className="rounded-sm border border-warning/50 px-4 py-3">
            <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.14em] text-warning">
              <Clock className="size-4" aria-hidden />
              {BOOKING_STATUS_LABEL[state]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Booking ID <span className="font-display text-foreground">{booking.reference}</span>
            </p>
          </div>
          <ButtonLink
            to="/rides/$slug/book"
            params={{ slug: ride.slug }}
            variant={awaitingRider ? "primary" : "outline"}
            size="lg"
            className="mt-3 w-full"
          >
            {awaitingRider ? "Complete payment" : "View my ride"}
          </ButtonLink>
        </>
      ) : ride.registrationOpen ? (
        <>
          {booking && state === "cancelled" ? (
            <p className="mb-3 text-xs text-muted-foreground">
              {booking.holdExpired ? "The seat hold on booking " : "Booking "}
              <span className="font-display text-foreground">{booking.reference}</span>
              {booking.holdExpired ? " ran out before a payment proof arrived." : " was cancelled."}
            </p>
          ) : null}
          <ButtonLink
            to="/rides/$slug/book"
            params={{ slug: ride.slug }}
            size="lg"
            className="w-full"
          >
            {state === "cancelled" ? "Book again" : "Reserve your spot"}
          </ButtonLink>
        </>
      ) : (
        <Button size="lg" className="w-full" disabled>
          {availability === "Full" ? "Sold out" : availability}
        </Button>
      )}
      <p role="status" className="mt-2 min-h-5 text-xs text-muted-foreground">
        {registration.isError
          ? "Your booking status didn't load. Refresh to check it."
          : hydrated && status === "unauthenticated" && ride.registrationOpen
            ? "You'll be asked to log in before your spot is reserved."
            : null}
      </p>
    </div>
  );
}
