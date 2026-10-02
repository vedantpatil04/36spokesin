import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui-kit";
import { ApiError } from "@/lib/api";
import { describeError } from "@/services/request-helpers";
import { cancelRideBooking } from "@/services/rides";
import type { Ride, RideRegistration } from "@/types";

/**
 * "Cancel booking" with its confirmation prompt. The API decides whether the
 * cancellation is still allowed, keeps the booking as history and frees the
 * seat. Renders nothing once the ride has started, when the API would refuse.
 */
export function CancelBookingButton({
  ride,
  warning,
  onCancelled,
  onStale,
}: {
  ride: Ride;
  /** An extra line for the prompt, e.g. about a payment that was already verified. */
  warning?: string | undefined;
  onCancelled: (booking: RideRegistration) => void;
  /** The API no longer agrees with what is shown (e.g. cancelled in another tab). */
  onStale: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (new Date(ride.startsAt).getTime() <= Date.now()) return null;

  const cancel = async () => {
    setPending(true);
    setFailure(null);
    try {
      onCancelled(await cancelRideBooking(ride.id));
      setConfirming(false);
    } catch (error) {
      setConfirming(false);
      // Already cancelled or gone: show what the API has now instead of an error.
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) onStale();
      else setFailure(describeError(error, "The booking wasn't cancelled. Try again."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-5">
      <AlertDialog.Root open={confirming} onOpenChange={(open) => !pending && setConfirming(open)}>
        <AlertDialog.Trigger asChild>
          <Button variant="outline" className="hover:border-destructive hover:text-destructive">
            Cancel booking
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/80" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border-strong bg-background p-6 shadow-lift">
            <AlertDialog.Title className="text-2xl">Cancel this ride?</AlertDialog.Title>
            <AlertDialog.Description className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You will lose your seat on:
              <span className="mt-1 block font-display text-base uppercase text-foreground">
                {ride.name}
              </span>
              {warning ? <span className="mt-3 block">{warning}</span> : null}
            </AlertDialog.Description>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={pending}>
                  Keep booking
                </Button>
              </AlertDialog.Cancel>
              <Button
                disabled={pending}
                className="bg-destructive text-destructive-foreground"
                onClick={() => void cancel()}
              >
                {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
                Cancel ride
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
      <p role="alert" className="mt-3 min-h-5 text-sm text-destructive">
        {failure}
      </p>
    </div>
  );
}
