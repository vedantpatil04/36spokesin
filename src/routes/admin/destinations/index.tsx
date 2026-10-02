import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { MapPinned, Plus } from "lucide-react";
import { useState } from "react";
import { AdminRecordTable } from "@/components/admin/AdminRecordTable";
import { AdminPageHeader, ProductStatusBadge } from "@/components/admin/admin-ui";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { ButtonLink, SelectInput, TextInput } from "@/components/ui-kit";
import type { ApiContentStatus } from "@/lib/api";
import { listAdminDestinations } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/destinations/")({
  component: AdminDestinationsPage,
});

function AdminDestinationsPage() {
  const [status, setStatus] = useState<ApiContentStatus | "">("");
  const [q, setQ] = useState("");
  const destinations = useQuery({
    queryKey: ["admin", "destinations", status, q],
    queryFn: () => listAdminDestinations({ status: status || undefined, q }),
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Destinations"
        description="Regions on the Travel pages. Only published destinations are public."
        actions={
          <ButtonLink to="/admin/destinations/new">
            <Plus className="size-4" aria-hidden />
            New destination
          </ButtonLink>
        }
      />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
        <TextInput
          aria-label="Search destinations"
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
      {destinations.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : destinations.isError ? (
        <ErrorState
          title="Destinations didn't load"
          description={describeError(destinations.error)}
          onRetry={() => void destinations.refetch()}
        />
      ) : destinations.data.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title={q || status ? "No destinations match" : "No destinations yet"}
          description="Create a destination, then add its trips and photos."
        />
      ) : (
        <AdminRecordTable
          columns={["Region", "Difficulty", "Trips", "Photos"]}
          rows={destinations.data.map((destination) => ({
            id: destination.id,
            thumbUrl: destination.primaryImage?.url ?? null,
            title: (
              <Link
                to="/admin/destinations/$destinationId"
                params={{ destinationId: destination.id }}
                className="hover:text-primary"
              >
                {destination.name}
              </Link>
            ),
            subtitle: destination.featured ? "Featured" : undefined,
            status: <ProductStatusBadge status={destination.status} />,
            cells: [
              destination.region,
              destination.difficulty.toLowerCase(),
              destination.tripCount,
              destination.images.length,
            ],
            updatedAt: destination.updatedAt,
          }))}
        />
      )}
    </div>
  );
}
