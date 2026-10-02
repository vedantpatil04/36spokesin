import { useQuery } from "@tanstack/react-query";
import { listMyRides } from "@/services/rides";
import { useAuthUser } from "@/state/auth";

/** Rides the signed-in rider has joined, soonest first. Browser-only (needs the token). */
export function useMyRides() {
  const user = useAuthUser();
  return useQuery({
    queryKey: ["my-rides", user?.id],
    queryFn: listMyRides,
    enabled: Boolean(user),
  });
}
