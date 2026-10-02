import { createFileRoute } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { CommunityAdminPage } from "@/components/admin/community/CommunityAdminPage";
import { FounderForm } from "@/components/admin/community/FounderForm";
import { adminFounders } from "@/services/admin/community";

export const Route = createFileRoute("/admin/community/founders")({
  component: () => (
    <CommunityAdminPage
      title="Founders"
      description="The founders shown on the Community page. Add a role, bio, story, quote, links and photo as the business supplies them."
      noun="founder"
      resourceKey="founders"
      icon={UserRound}
      api={adminFounders}
      toRow={(founder) => ({
        thumbUrl: founder.image?.url ?? null,
        title: founder.name,
        subtitle: founder.role,
      })}
      renderForm={({ item, onDone, onCancel }) => (
        <FounderForm key={item?.id ?? "new"} founder={item} onDone={onDone} onCancel={onCancel} />
      )}
    />
  ),
});
