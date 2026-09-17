import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { MemberNav } from "@/components/member/MemberNav";
import { PageSkeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { getMemberOverview } from "@/services/member";
import { useAuthStatus, useAuthUser } from "@/state/auth";

/**
 * My 36 Spokes shell: greeting, section navigation and the active section.
 * The greeting uses the authenticated user; the sample member overview (bikes,
 * rides, trips, orders) loads once here and is shared by every section.
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

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated" || !user) {
    return <PageSkeleton />;
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">My 36 Spokes</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">Welcome back, {user.firstName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is connected — the bikes, rides, trips and orders below are still sample
            data until those areas move to the API.
          </p>
        </div>
        <ButtonLink to="/profile" variant="outline">
          Complete your profile
        </ButtonLink>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <MemberNav />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
