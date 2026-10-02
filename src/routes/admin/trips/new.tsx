import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TripEditor } from "@/components/admin/travel/TripEditor";
import { AdminPageHeader, AdminPanel } from "@/components/admin/admin-ui";
import { ErrorState, PageSkeleton } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { listAdminDestinations } from "@/services/admin/travel";

export const Route = createFileRoute("/admin/trips/new")({
  component: NewTripPage,
});

function NewTripPage() {
  const destinations = useQuery({
    queryKey: ["admin", "destinations", "", ""],
    queryFn: () => listAdminDestinations(),
  });
  if (destinations.isPending) return <PageSkeleton layout="detail" />;
  if (destinations.isError)
    return (
      <ErrorState title="The editor didn't load" onRetry={() => void destinations.refetch()} />
    );
  if (destinations.data.length === 0) {
    return (
      <div className="space-y-6">
        <AdminPageHeader eyebrow="Trips" title="New trip" />
        <AdminPanel title="Add a destination first">
          <p className="text-sm text-muted-foreground">Every trip belongs to a destination.</p>
          <ButtonLink to="/admin/destinations/new" variant="outline" className="mt-4">
            New destination
          </ButtonLink>
        </AdminPanel>
      </div>
    );
  }
  return <TripEditor trip={null} destinations={destinations.data} />;
}
