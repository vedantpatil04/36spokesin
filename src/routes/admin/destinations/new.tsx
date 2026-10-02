import { createFileRoute } from "@tanstack/react-router";
import { DestinationEditor } from "@/components/admin/travel/DestinationEditor";

export const Route = createFileRoute("/admin/destinations/new")({
  component: () => <DestinationEditor destination={null} />,
});
