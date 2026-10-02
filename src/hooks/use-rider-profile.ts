import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getRiderProfile, updateRiderProfile } from "@/services/auth";
import { useAuthUser } from "@/state/auth";

const riderProfileKey = (userId: string | undefined) => ["rider-profile", userId] as const;

/** The signed-in rider's profile (city, photo, member since). Browser-only (needs the token). */
export function useRiderProfile() {
  const user = useAuthUser();
  return useQuery({
    queryKey: riderProfileKey(user?.id),
    queryFn: getRiderProfile,
    enabled: Boolean(user),
  });
}

/** Saves the rider's city and keeps every `useRiderProfile` reader on the API's copy. */
export function useSaveRiderProfile() {
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const userId = user?.id;
  return useCallback(
    async (input: { city: string | null }) => {
      const profile = await updateRiderProfile(input);
      queryClient.setQueryData(riderProfileKey(userId), profile);
      return profile;
    },
    [queryClient, userId],
  );
}
