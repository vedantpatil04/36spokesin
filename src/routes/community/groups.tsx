import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { GroupCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listGroups } from "@/services/community";

export const Route = createFileRoute("/community/groups")({
  loader: async () => ({ groups: await listGroups() }),
  head: () =>
    seo({
      title: "Local Riding Groups | 36 Spokes Community",
      description:
        "36 Spokes crews in Pune, Bengaluru, Mumbai and more: who they are, how often they ride and how to join.",
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
        title="Groups"
        description="Local crews that host rides, garage nights and workshops. Pick the one nearest you."
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
            title="No groups in your area yet"
            description="Crews start when a few riders in a city want to ride together."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
