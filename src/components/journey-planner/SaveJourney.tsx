import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button, ButtonLink } from "@/components/ui-kit";
import { saveJourney } from "@/services/journey-planner";
import { describeError } from "@/services/request-helpers";
import { useAuthStatus } from "@/state/auth";
import type { PlannedJourney } from "@/types";

/**
 * Keeps a plan in the rider's account. Signed-out riders are sent to sign in
 * and come back to the same plan (`onSignIn` lets the planner hold on to it);
 * `saveOnArrival` finishes the save they asked for before signing in.
 */
export function SaveJourney({
  planned,
  saveOnArrival,
  onSignIn,
  onSaved,
}: {
  planned: PlannedJourney;
  saveOnArrival: boolean;
  onSignIn: () => void;
  onSaved: () => void;
}) {
  const status = useAuthStatus();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: () => saveJourney(planned),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-journeys"] });
      onSaved();
    },
  });

  // The rider pressed Save while signed out: complete it once, now that they're back.
  const arrived = useRef(false);
  const { mutate } = save;
  useEffect(() => {
    if (!saveOnArrival || arrived.current || status !== "authenticated") return;
    arrived.current = true;
    mutate();
  }, [saveOnArrival, status, mutate]);

  if (save.isSuccess) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2" role="status">
        <p className="flex items-center gap-2 text-sm text-foreground">
          <BookmarkCheck className="size-4 text-success" aria-hidden />
          Saved to My Journeys.
        </p>
        <ButtonLink
          to="/my-36-spokes/journeys/$journeyId"
          params={{ journeyId: save.data.id }}
          variant="outline"
          size="sm"
        >
          Open saved journey
        </ButtonLink>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ButtonLink to="/login" search={{ redirect: "/plan" }} onClick={onSignIn}>
          <Bookmark className="size-4" aria-hidden />
          Sign in to save
        </ButtonLink>
        <p className="text-xs text-muted-foreground">Your plan stays here while you sign in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button onClick={() => save.mutate()} disabled={status === "loading" || save.isPending}>
        {save.isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <Bookmark className="size-4" aria-hidden />
        )}
        {save.isPending ? "Saving" : "Save journey"}
      </Button>
      {save.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {describeError(save.error, "The journey wasn't saved. Try again.")}
        </p>
      ) : null}
    </div>
  );
}
