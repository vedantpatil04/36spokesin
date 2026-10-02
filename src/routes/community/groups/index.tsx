import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { GroupCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listGroups } from "@/services/community";

export const Route = createFileRoute("/community/groups/")({
  loader: async () => ({ groups: await listGroups() }),
  head: () =>
    seo({
      title: "Groups & Chapters | 36 Spokes Community",
      description:
        "Local 36 Spokes groups and chapters: where they ride from, how often they ride and how to join.",
      path: "/community/groups",
    }),
  component: GroupsPage,
});

function GroupsPage() {
  const { groups } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Groups & chapters"
        description="Local groups that ride together. Pick the one nearest you."
        image={media.riders.community}
      >
        <ButtonLink to="/community" hash="events" variant="outline">
          Upcoming events
        </ButtonLink>
      </PageHeader>
      <Section>
        {groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Groups start when a few riders in a city want to ride together."
            action={
              <ButtonLink to="/join" variant="outline">
                Join 36 Spokes
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupCard group={group} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
