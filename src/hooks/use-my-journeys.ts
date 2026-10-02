import { useQuery } from "@tanstack/react-query";
import { getMyJourney, listMyJourneys } from "@/services/journey-planner";
import { useAuthUser } from "@/state/auth";
import type { ID } from "@/types";

/** Journeys the signed-in rider saved, newest first. Browser-only (needs the token). */
export function useMyJourneys() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["my-journeys", user?.id],
    queryFn: listMyJourneys,
    enabled: Boolean(user),
  });
}

/** One saved journey with its stored plan; `null` when it isn't the rider's or no longer exists. */
export function useMyJourney(id: ID) {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["my-journeys", user?.id, id],
    queryFn: () => getMyJourney(id),
    enabled: Boolean(user),
    // A saved plan never changes, so there is nothing to refetch.
    staleTime: Infinity,
  });
}
