import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TripEditor } from "@/components/admin/travel/TripEditor";
import { ErrorState, PageSkeleton } from "@/components/states";
import { getAdminTrip, listAdminDestinations } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";

export const Route = createFileRoute("/admin/trips/$tripId")({
  component: EditTripPage,
});

function EditTripPage() {
  const { tripId } = Route.useParams();
  const trip = useQuery({
    queryKey: ["admin", "trip", tripId],
    queryFn: () => getAdminTrip(tripId),
    refetchOnWindowFocus: false,
  });
  const destinations = useQuery({
    queryKey: ["admin", "destinations", "", ""],
    queryFn: () => listAdminDestinations(),
  });
  if (trip.isPending || destinations.isPending) return <PageSkeleton layout="detail" />;
  if (trip.isError || destinations.isError) {
    return (
      <ErrorState
        title="This trip didn't load"
        description={describeError(trip.error ?? destinations.error)}
        onRetry={() => void trip.refetch()}
      />
    );
  }
  return <TripEditor key={trip.data.id} trip={trip.data} destinations={destinations.data} />;
}
