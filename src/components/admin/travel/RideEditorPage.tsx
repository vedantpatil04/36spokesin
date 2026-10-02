import { useQuery } from "@tanstack/react-query";
import { ErrorState, PageSkeleton } from "@/components/states";
import { getAdminRide, listAdminDestinations, listAdminTrips } from "@/services/admin/travel";
import { describeError } from "@/services/request-helpers";
import { RideEditor } from "./RideEditor";

/** Loads what the ride editor needs (the ride, destinations and trips to link to). */
export function RideEditorPage({ rideId }: { rideId: string | null }) {
  const ride = useQuery({
    queryKey: ["admin", "ride", rideId],
    queryFn: () => (rideId ? getAdminRide(rideId) : Promise.resolve(null)),
    refetchOnWindowFocus: false,
  });
  const destinations = useQuery({
    queryKey: ["admin", "destinations", "", ""],
    queryFn: () => listAdminDestinations(),
  });
  const trips = useQuery({ queryKey: ["admin", "trips", "", ""], queryFn: () => listAdminTrips() });

  if (ride.isPending || destinations.isPending || trips.isPending)
    return <PageSkeleton layout="detail" />;
  if (ride.isError || destinations.isError || trips.isError) {
    return (
      <ErrorState
        title="The ride editor didn't load"
        description={describeError(ride.error ?? destinations.error ?? trips.error)}
        onRetry={() => {
          void ride.refetch();
          void destinations.refetch();
          void trips.refetch();
        }}
      />
    );
  }
  return (
    <RideEditor
      key={ride.data?.id ?? "new"}
      ride={ride.data}
      destinations={destinations.data}
      trips={trips.data}
    />
  );
}
