import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * After a CMS change: refetch admin queries and invalidate route loaders, so
 * the storefront shows the new data on the next navigation. Nothing is cached
 * for longer than that.
 */
export function useCatalogRefresh() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useCallback(
    async (...keys: string[][]) => {
      await Promise.all([
        ...keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        // Storefront product queries (e.g. "recommended for your bike").
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        router.invalidate(),
      ]);
    },
    [queryClient, router],
  );
}
