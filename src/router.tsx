import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { NotFoundPage, PageSkeleton, RouteErrorState } from "@/components/states";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Fetch route code and data when a link is hovered or focused.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Shown only if a loader takes longer than the router's pending threshold.
    defaultPendingComponent: () => <PageSkeleton />,
    // Route failures keep the navbar and footer; the root route has its own full-page fallback.
    defaultErrorComponent: RouteErrorState,
    defaultNotFoundComponent: NotFoundPage,
  });

  return router;
};
