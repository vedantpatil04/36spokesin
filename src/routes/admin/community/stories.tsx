import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { CommunityAdminPage } from "@/components/admin/community/CommunityAdminPage";
import { StoryForm } from "@/components/admin/community/StoryForm";
import { adminStories } from "@/services/admin/community";

export const Route = createFileRoute("/admin/community/stories")({
  component: () => (
    <CommunityAdminPage
      title="Stories"
      description="Rider stories on Community and /stories. Featured stories are listed first."
      noun="story"
      resourceKey="stories"
      icon={BookOpen}
      api={adminStories}
      toRow={(story) => ({
        thumbUrl: story.cover?.url ?? null,
        title: story.title,
        subtitle: [
          story.featured ? "Featured" : null,
          story.authorName ? `By ${story.authorName}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })}
      renderForm={({ item, onDone, onCancel }) => (
        <StoryForm key={item?.id ?? "new"} story={item} onDone={onDone} onCancel={onCancel} />
      )}
    />
  ),
});
