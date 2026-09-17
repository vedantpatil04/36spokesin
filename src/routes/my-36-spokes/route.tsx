import { Outlet, createFileRoute } from "@tanstack/react-router";
import { MemberNav } from "@/components/member/MemberNav";
import { PageSkeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { getMemberOverview } from "@/services/member";

/**
 * My 36 Spokes shell: greeting, section navigation and the active section.
 * The member overview loads once here and is shared by every section.
 * Metadata (including noindex) is set by the child routes.
 */
export const Route = createFileRoute("/my-36-spokes")({
  loader: () => getMemberOverview(),
  pendingComponent: () => <PageSkeleton />,
  component: MemberLayout,
});

function MemberLayout() {
  const { greeting } = Route.useLoaderData();

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">My 36 Spokes</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">{greeting}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preview of the member experience — signed-in data is not connected yet.
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
