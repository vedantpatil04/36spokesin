import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { DestinationEditor } from "@/components/admin/travel/DestinationEditor";
import { ErrorState, PageSkeleton } from "@/components/states";
import { getAdminDestination } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/destinations/$destinationId")({
  component: EditDestinationPage,
});

function EditDestinationPage() {
  const { destinationId } = Route.useParams();
  const destination = useQuery({
    queryKey: ["admin", "destination", destinationId],
    queryFn: () => getAdminDestination(destinationId),
    refetchOnWindowFocus: false,
  });
  if (destination.isPending) return <PageSkeleton layout="detail" />;
  if (destination.isError) {
    return (
      <ErrorState
        title="This destination didn't load"
        description={describeError(destination.error)}
        onRetry={() => void destination.refetch()}
      />
    );
  }
  return <DestinationEditor key={destination.data.id} destination={destination.data} />;
}
