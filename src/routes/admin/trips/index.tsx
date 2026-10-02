import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminPageHeader, ProductStatusBadge } from "@/components/admin/admin-ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiContentStatus } from "@/lib/api";
import { listAdminTrips } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/trips/")({
  component: AdminTripsPage,
});

function AdminTripsPage() {
  const [status, setStatus] = useState<ApiContentStatus | "">("");
  const [q, setQ] = useState("");
  const trips = useQuery({
    queryKey: ["admin", "trips", status, q],
    queryFn: () => listAdminTrips({ status: status || undefined, q }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Trips"
        description="Multi-day trips with itineraries and dated departures. A trip is public when it and its destination are published."
        actions={
          <ButtonLink to="/admin/trips/new">
            <Plus className="size-4" aria-hidden />
            New trip
          </ButtonLink>
        }
      />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
        <TextInput
          aria-label="Search trips"
          type="search"
          placeholder="Search by name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mt-0 h-11"
        />
        <SelectInput
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ApiContentStatus | "")}
          className="mt-0 h-11"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </SelectInput>
      </div>
      {trips.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : trips.isError ? (
        <ErrorState
          title="Trips didn't load"
          description={describeError(trips.error)}
          onRetry={() => void trips.refetch()}
        />
      ) : trips.data.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={q || status ? "No trips match" : "No trips yet"}
          description="Create a destination first, then its trips."
        />
      ) : (
        <AdminRecordTable
          columns={["Destination", "Days", "Itinerary", "Departures"]}
          rows={trips.data.map((trip) => ({
            id: trip.id,
            thumbUrl: trip.primaryImage?.url ?? null,
            title: (
              <Link
                to="/admin/trips/$tripId"
                params={{ tripId: trip.id }}
                className="hover:text-primary"
              >
                {trip.name}
              </Link>
            ),
            subtitle: trip.featured ? "Featured" : undefined,
            status: <ProductStatusBadge status={trip.status} />,
            cells: [
              trip.destination.name,
              trip.durationDays,
              `${trip.itinerary.length} days`,
              trip.departures.length,
            ],
            updatedAt: trip.updatedAt,
          }))}
        />
      )}
    </div>
  );
}
