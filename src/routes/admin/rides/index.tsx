import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Route as RouteIcon } from "lucide-react";
import { useState } from "react";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { RIDE_STATUS_OPTIONS } from "@/components/admin/admin-options";
import { AdminPageHeader, RideStatusBadge } from "@/components/admin/admin-ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiRideStatus } from "@/lib/api";
import { formatRideStart } from "@/lib/ride-format";
import { listAdminRides } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/rides/")({
  component: AdminRidesPage,
});

function AdminRidesPage() {
  const [status, setStatus] = useState<ApiRideStatus | "">("");
  const [q, setQ] = useState("");
  const rides = useQuery({
    queryKey: ["admin", "rides", status, q],
    queryFn: () => listAdminRides({ status: status || undefined, q }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Rides"
        description="Day loops, weekenders and group rides. Riders join from the public ride page."
        actions={
          <ButtonLink to="/admin/rides/new">
            <Plus className="size-4" aria-hidden />
            New ride
          </ButtonLink>
        }
      />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
        <TextInput
          aria-label="Search rides"
          type="search"
          placeholder="Search by title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-0 h-11"
        />
        <SelectInput
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApiRideStatus | "")}
          className="mt-0 h-11"
        >
          <option value="">All statuses</option>
          {RIDE_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </div>
      {rides.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : rides.isError ? (
        <ErrorState
          title="Rides didn't load"
          description={describeError(rides.error)}
          onRetry={() => void rides.refetch()}
        />
      ) : rides.data.length === 0 ? (
        <EmptyState
          icon={RouteIcon}
          title={q || status ? "No rides match" : "No rides yet"}
          description="Create a ride and publish it as Upcoming so riders can join."
        />
      ) : (
        <AdminRecordTable
          columns={["Starts (IST)", "Location", "Riders"]}
          rows={rides.data.map((ride) => ({
            id: ride.id,
            thumbUrl: ride.primaryImage?.url ?? null,
            title: (
              <Link
                to="/admin/rides/$rideId"
                params={{ rideId: ride.id }}
                className="hover:text-primary"
              >
                {ride.title}
              </Link>
            ),
            subtitle: ride.featured ? "Featured" : undefined,
            status: <RideStatusBadge status={ride.status} />,
            cells: [
              formatRideStart(ride.startsAt),
              ride.location,
              `${ride.registeredCount} / ${ride.capacity}`,
            ],
            updatedAt: ride.updatedAt,
          }))}
        />
      )}
    </div>
  );
}
