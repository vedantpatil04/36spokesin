import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";
import { CommunityAdminPage } from "@/components/admin/community/CommunityAdminPage";
import { GroupForm } from "@/components/admin/community/GroupForm";
import { adminGroups } from "@/services/admin/community";

export const Route = createFileRoute("/admin/community/groups")({
  component: () => (
    <CommunityAdminPage
      title="Groups"
      description="Local groups and chapters, listed on Community and /community/groups."
      noun="group"
      resourceKey="groups"
      icon={UsersRound}
      api={adminGroups}
      toRow={(group) => ({
        thumbUrl: group.cover?.url ?? null,
        title: group.name,
        subtitle: [group.region, group.rideCadence].filter(Boolean).join(" · "),
      })}
      renderForm={({ item, onDone, onCancel }) => (
        <GroupForm key={item?.id ?? "new"} group={item} onDone={onDone} onCancel={onCancel} />
      )}
    />
  ),
});
