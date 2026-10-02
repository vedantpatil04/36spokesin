import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { CommunityAdminPage } from "@/components/admin/community/CommunityAdminPage";
import { RiderSpotlightForm } from "@/components/admin/community/RiderSpotlightForm";
import { adminRiderSpotlights } from "@/services/admin/community";

export const Route = createFileRoute("/admin/community/riders")({
  component: () => (
    <CommunityAdminPage
      title="Rider spotlights"
      description="Riders featured on the Community page, with only the details they chose to share."
      noun="rider spotlight"
      resourceKey="riders"
      icon={Users}
      api={adminRiderSpotlights}
      toRow={(rider) => ({
        thumbUrl: rider.image?.url ?? null,
        title: rider.name,
        subtitle: [rider.bike, rider.location].filter(Boolean).join(" · "),
      })}
      renderForm={({ item, onDone, onCancel }) => (
        <RiderSpotlightForm
          key={item?.id ?? "new"}
          spotlight={item}
          onDone={onDone}
          onCancel={onCancel}
        />
      )}
    />
  ),
});
