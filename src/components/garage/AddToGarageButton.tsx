import { Check, LoaderCircle, Plus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui-kit";
import { useAccountAction } from "@/hooks/use-account-action";
import { useAuthStatus } from "@/state/auth";
import { useGarageActions, useMyBikes } from "@/state/garage";
import type { Bike } from "@/types";

/** Adds a catalogue bike to the signed-in rider's own garage (or links to it if already there). */
export function AddToGarageButton({ bike, size = "lg" }: { bike: Bike; size?: "sm" | "lg" }) {
  const signedIn = useAuthStatus() === "authenticated";
  const owned = useMyBikes().some((entry) => entry.bikeId === bike.id);
  const garage = useGarageActions();
  const action = useAccountAction();

  if (signedIn && owned) {
    return (
      <ButtonLink to="/my-36-spokes/garage" variant="outline" size={size}>
        <Check className="size-4" aria-hidden />
        In your garage
      </ButtonLink>
    );
  }

  return (
    <div>
      <Button
        variant="outline"
        size={size}
        disabled={action.pending}
        onClick={() =>
          void action.run(() =>
            garage.add({
              bikeId: bike.id,
              variantId: null,
              nickname: null,
              year: null,
              odometerKm: null,
            }),
          )
        }
      >
        {action.pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="size-4" aria-hidden />
        )}
        Add to my garage
      </Button>
      {action.error ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {action.error}
        </p>
      ) : null}
    </div>
  );
}
