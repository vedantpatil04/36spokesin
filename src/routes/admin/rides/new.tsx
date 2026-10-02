import { createFileRoute } from "@tanstack/react-router";
import { RideEditorPage } from "@/components/admin/travel/RideEditorPage";

export const Route = createFileRoute("/admin/rides/new")({
  component: () => <RideEditorPage rideId={null} />,
});
