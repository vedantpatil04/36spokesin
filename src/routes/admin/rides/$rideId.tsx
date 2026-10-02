import { createFileRoute } from "@tanstack/react-router";
import { RideEditorPage } from "@/components/admin/travel/RideEditorPage";

export const Route = createFileRoute("/admin/rides/$rideId")({
  component: EditRidePage,
});

function EditRidePage() {
  const { rideId } = Route.useParams();
  return <RideEditorPage rideId={rideId} />;
}
