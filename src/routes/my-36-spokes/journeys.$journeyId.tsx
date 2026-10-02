import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { JourneyPlanResult } from "@/components/journey-planner/JourneyPlanResult";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { useMyJourney } from "@/hooks/use-my-journeys";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/my-36-spokes/journeys/$journeyId")({
  head: () =>
    seo({
      title: "Saved Journey | My 36 Spokes",
      description: "A journey plan you saved.",
      path: "/my-36-spokes/journeys",
      noIndex: true,
    }),
  component: SavedJourneyPage,
});

/** A saved journey, shown from the plan stored in the rider's account. Nothing is planned again. */
function SavedJourneyPage() {
  const { journeyId } = Route.useParams();
  const journey = useMyJourney(journeyId);

  return (
    <div>
      <ButtonLink to="/my-36-spokes/journeys" variant="ghost" size="sm" className="-ml-3.5 mb-4">
        <ArrowLeft className="size-3.5" aria-hidden />
        My journeys
      </ButtonLink>

      {journey.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : journey.isError ? (
        <ErrorState title="This journey didn't load" onRetry={() => void journey.refetch()} />
      ) : journey.data ? (
        <div className="max-w-3xl">
          <JourneyPlanResult plan={journey.data.plan} headingId="saved-journey-heading" />
        </div>
      ) : (
        <EmptyState
          title="Journey not found"
          description="It may have been deleted, or it belongs to another account."
          action={
            <ButtonLink to="/my-36-spokes/journeys" variant="outline">
              Back to my journeys
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
