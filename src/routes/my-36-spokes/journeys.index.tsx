import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon } from "lucide-react";
import { useState } from "react";
import { MemberPageTitle } from "@/components/member/MemberPanel";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui-kit";
import { useMyJourneys } from "@/hooks/use-my-journeys";
import { formatLongDate, parseISODate } from "@/lib/dates";
import { pluralize } from "@/lib/format";
import { formatDistance, formatDuration } from "@/lib/journey-planner";
import { seo } from "@/lib/seo";
import { deleteMyJourney } from "@/services/journey-planner";
import { describeError } from "@/services/request-helpers";
import type { SavedJourneySummary } from "@/types";

export const Route = createFileRoute("/my-36-spokes/journeys/")({
  head: () =>
    seo({
      title: "My Journeys | My 36 Spokes",
      description: "The journey plans you've saved.",
      path: "/my-36-spokes/journeys",
      noIndex: true,
    }),
  component: MemberJourneysPage,
});

function MemberJourneysPage() {
  const journeys = useMyJourneys();

  return (
    <div>
      <MemberPageTitle
        title="My journeys"
        description="Plans you saved from the journey planner, kept exactly as they were made."
      />

      {journeys.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : journeys.isError ? (
        <ErrorState title="Your journeys didn't load" onRetry={() => void journeys.refetch()} />
      ) : journeys.data.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title="No saved journeys yet"
          description="Plan a journey, then save it to find it here."
          action={
            <ButtonLink to="/plan" hash="planner" variant="outline">
              Plan a journey
            </ButtonLink>
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {journeys.data.map((journey) => (
              <JourneyRow key={journey.id} journey={journey} />
            ))}
          </ul>
          <div className="mt-6">
            <ButtonLink to="/plan" hash="planner" variant="outline" size="sm">
              Plan another journey
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  );
}

const longDate = (value: string) => {
  const date = parseISODate(value.slice(0, 10));
  return date ? formatLongDate(date) : value;
};

/** One saved journey: where, when, how far, and the way in to its stored plan. */
function JourneyRow({ journey }: { journey: SavedJourneySummary }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteMyJourney(journey.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-journeys"] }),
  });

  const facts = [
    { label: "Travel date", value: longDate(journey.travelDate) },
    { label: "Distance", value: formatDistance(journey.distanceKm) },
    { label: "Riding time", value: `About ${formatDuration(journey.rideMinutes)}` },
    { label: "Riders", value: pluralize(journey.riders, "rider") },
  ];

  return (
    <li className="rounded-sm border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg leading-tight">
          <Link
            to="/my-36-spokes/journeys/$journeyId"
            params={{ journeyId: journey.id }}
            className="hover:text-primary"
          >
            {journey.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">Saved {longDate(journey.createdAt)}</p>
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ButtonLink
          to="/my-36-spokes/journeys/$journeyId"
          params={{ journeyId: journey.id }}
          size="sm"
        >
          View journey
        </ButtonLink>
        {confirming ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? "Deleting" : "Yes, delete it"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => setConfirming(false)}
            >
              Keep it
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Delete
          </Button>
        )}
        {remove.isError ? (
          <p role="alert" className="text-xs text-destructive">
            {describeError(remove.error, "The journey wasn't deleted. Try again.")}
          </p>
        ) : null}
      </div>
    </li>
  );
}
