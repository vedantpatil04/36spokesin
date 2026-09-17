import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { SetupChecklist } from "@/components/garage/SetupChecklist";
import { GarageBikeCard } from "@/components/member/GarageBikeCard";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { formatLongDate, parseISODate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/garage")({
  head: () =>
    seo({
      title: "My Garage | My 36 Spokes",
      description: "Your registered motorcycles, trip-ready check and maintenance log.",
      path: "/my-36-spokes/garage",
      noIndex: true,
    }),
  component: MemberGaragePage,
});

function MemberGaragePage() {
  const { bikes, setupChecklist, maintenance } = memberRoute.useLoaderData();

  return (
    <div>
      <MemberPageTitle
        title="My garage"
        description="The motorcycles you ride, how ready they are for a trip, and the work done on them."
      />
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          {bikes.map((garageBike) => (
            <GarageBikeCard key={garageBike.id} garageBike={garageBike} linkToDetails />
          ))}
          <MemberPanel title="Setup readiness" headingLevel="h3">
            <SetupChecklist items={setupChecklist} variant="compact" />
          </MemberPanel>
        </div>

        <MemberPanel title="Maintenance log" headingLevel="h3">
          {maintenance.length === 0 ? (
            <EmptyState
              icon={Wrench}
              className="mt-4"
              title="No maintenance records yet"
              description="Services, repairs and parts fitted at partner workshops will be logged here automatically."
              action={
                <ButtonLink to="/garage" variant="outline">
                  Explore garage services
                </ButtonLink>
              }
            />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {maintenance.map((record) => {
                const date = parseISODate(record.date);
                return (
                  <li key={record.id} className="py-3 text-sm">
                    <p className="text-foreground">{record.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {date ? formatLongDate(date) : record.date} <span aria-hidden>·</span>{" "}
                      {formatNumber(record.odometerKm)} km
                      {record.workshop ? ` · ${record.workshop}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </MemberPanel>
      </div>
    </div>
  );
}
