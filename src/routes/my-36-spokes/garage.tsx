import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { useState } from "react";
import { MyBikeForm } from "@/components/garage/MyBikeForm";
import { SetupChecklist } from "@/components/garage/SetupChecklist";
import { GarageBikeCard } from "@/components/member/GarageBikeCard";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { EmptyState, Skeleton } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui-kit";
import { useAccountAction } from "@/hooks/use-account-action";
import { formatLongDate, parseISODate } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { listBikes } from "@/services/catalog";
import { useGarageActions, useMyBikes, useMyBikesStatus } from "@/state/garage";
import type { GarageBike, ID, OwnedBikeInput } from "@/types";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/garage")({
  loader: async () => ({ catalogue: await listBikes() }),
  head: () =>
    seo({
      title: "My Garage | My 36 Spokes",
      description: "Your registered motorcycles, trip-ready check and maintenance log.",
      path: "/my-36-spokes/garage",
      noIndex: true,
    }),
  component: MemberGaragePage,
});

type Editing = { mode: "add" } | { mode: "edit"; bike: GarageBike } | null;

function MemberGaragePage() {
  const { catalogue } = Route.useLoaderData();
  const { setupChecklist, maintenance } = memberRoute.useLoaderData();
  const bikes = useMyBikes();
  const status = useMyBikesStatus();
  const garage = useGarageActions();
  const form = useAccountAction();
  const rowAction = useAccountAction();
  const [editing, setEditing] = useState<Editing>(null);
  const [busyId, setBusyId] = useState<ID | null>(null);

  const save = async (input: OwnedBikeInput) => {
    const result = await form.run(() =>
      editing?.mode === "edit" ? garage.update(editing.bike.id, input) : garage.add(input),
    );
    if (result) setEditing(null);
  };

  const runOnBike = (id: ID, action: () => Promise<unknown>) => {
    setBusyId(id);
    void rowAction.run(action).finally(() => setBusyId(null));
  };

  return (
    <div>
      <MemberPageTitle
        title="My garage"
        description="The motorcycles you ride. Your main bike decides the gear we show as a fit."
      />
      <div className="space-y-4">
        {editing ? (
          <MemberPanel
            title={editing.mode === "add" ? "Add a motorcycle" : "Edit motorcycle"}
            headingLevel="h3"
          >
            <div className="mt-4">
              <MyBikeForm
                key={editing.mode === "edit" ? editing.bike.id : "add"}
                bikes={catalogue}
                {...(editing.mode === "edit" ? { initial: editing.bike } : {})}
                pending={form.pending}
                error={form.error}
                onSubmit={(input) => void save(input)}
                onCancel={() => {
                  form.clearError();
                  setEditing(null);
                }}
                submitLabel={editing.mode === "add" ? "Add to my garage" : "Save changes"}
              />
            </div>
          </MemberPanel>
        ) : (
          <div className="flex justify-end">
            <Button onClick={() => setEditing({ mode: "add" })} disabled={catalogue.length === 0}>
              <Plus className="size-4" aria-hidden />
              Add a motorcycle
            </Button>
          </div>
        )}

        {rowAction.error ? (
          <p role="alert" className="text-sm text-destructive">
            {rowAction.error}
          </p>
        ) : null}

        {status === "loading" && bikes.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : bikes.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No motorcycles added yet"
            description="Add the bike you ride and the shop marks the gear that fits it."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {bikes.map((garageBike) => (
              <GarageBikeCard
                key={garageBike.id}
                garageBike={garageBike}
                headingLevel="h3"
                linkToDetails
                actions={
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing({ mode: "edit", bike: garageBike })}
                      disabled={busyId !== null}
                    >
                      Edit
                    </Button>
                    {!garageBike.isPrimary ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          runOnBike(garageBike.id, () => garage.makePrimary(garageBike.id))
                        }
                        disabled={busyId !== null}
                      >
                        Make main bike
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const name = `${garageBike.bike.brand} ${garageBike.bike.model}`;
                        if (window.confirm(`Remove the ${name} from your garage?`)) {
                          runOnBike(garageBike.id, () => garage.remove(garageBike.id));
                        }
                      }}
                      disabled={busyId !== null}
                    >
                      Remove
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}

        <MemberPanel title="Setup readiness" headingLevel="h3">
          {setupChecklist.length > 0 ? (
            <SetupChecklist items={setupChecklist} variant="compact" />
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Your trip-readiness checklist will appear here once it's connected to your gear.
            </p>
          )}
        </MemberPanel>

        <MemberPanel title="Maintenance log" headingLevel="h3">
          {maintenance.length === 0 ? (
            <EmptyState
              icon={Wrench}
              className="mt-4"
              title="No maintenance records yet"
              description="Services, repairs and parts fitted at partner workshops will be logged here."
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
