import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MemberNav } from "@/components/member/MemberNav";
import { PageSkeleton } from "@/components/states";
import { getMemberOverview } from "@/services/member";
import { useAuthStatus, useAuthUser } from "@/state/auth";

/**
 * My 36 Spokes shell: greeting, then the active section. The rider home (the
 * index route) is the way into every section, so section navigation only
 * appears once the rider is inside one.
 * The greeting uses the authenticated user. Bikes, cart, wishlist and orders
 * are the rider's own account data from the API (see `@/state`); the member
 * overview loaded here only carries rides, travel and community content.
 * Metadata (including noindex) is set by the child routes.
 *
 * Protected client-side: the session lives in an httpOnly cookie the SSR
 * loader can't read, so the guard runs after hydration once auth state
 * resolves, rather than in `beforeLoad`.
 */
export const Route = createFileRoute("/my-36-spokes")({
  loader: () => getMemberOverview(),
  pendingComponent: () => <PageSkeleton />,
  component: MemberLayout,
});

function MemberLayout() {
  const status = useAuthStatus();
  const user = useAuthUser();
  const navigate = useNavigate();
  const isHome = useLocation({
    select: (location) => location.pathname.replace(/\/+$/, "") === "/my-36-spokes",
  });

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated" || !user) {
    return <PageSkeleton />;
  }

  return (
    <div className="container-page py-10 md:py-16">
      <p className="eyebrow">My 36 Spokes</p>
      <h1
        className={
          isHome
            ? "mt-3 text-4xl leading-[1.02] sm:text-5xl lg:text-6xl"
            : "mt-3 text-3xl sm:text-4xl"
        }
      >
        Welcome back, {user.firstName}
      </h1>
      {isHome ? null : <MemberNav className="mt-8" />}
      <div className={isHome ? "mt-4" : "mt-8"}>
        <Outlet />
      </div>
    </div>
  );
}
