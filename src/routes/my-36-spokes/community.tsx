import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { BookOpen, Users } from "lucide-react";
import { GroupCard, StoryCard } from "@/components/cards";
import { MemberPageTitle, MemberPanel } from "@/components/member/MemberPanel";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui-kit";
import { seo } from "@/lib/seo";

const memberRoute = getRouteApi("/my-36-spokes");

export const Route = createFileRoute("/my-36-spokes/community")({
  head: () =>
    seo({
      title: "My Community | My 36 Spokes",
      description: "The groups you ride with and the stories you've published.",
      path: "/my-36-spokes/community",
      noIndex: true,
    }),
  component: MemberCommunityPage,
});

function MemberCommunityPage() {
  const { groups, stories } = memberRoute.useLoaderData();

  return (
    <div>
      <MemberPageTitle
        title="My community"
        description="The crews you ride with and the stories you've written."
      />
      <div className="space-y-4">
        <MemberPanel title="Groups" headingLevel="h3">
          {groups.length > 0 ? (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <GroupCard group={group} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Users}
              className="mt-4"
              title="You haven't joined a group yet"
              description="Local crews host rides and garage nights every month."
              action={
                <ButtonLink to="/community/groups" variant="outline">
                  Find a group
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>

        <MemberPanel title="Stories" headingLevel="h3">
          {stories.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {stories.map((story) => (
                <StoryCard key={story.slug} story={story} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              className="mt-4"
              title="You haven't published a story yet"
              description="Write up a ride or a trip and share it with the community."
              action={
                <ButtonLink to="/stories" variant="outline">
                  Read ride stories
                </ButtonLink>
              }
            />
          )}
        </MemberPanel>
      </div>
    </div>
  );
}
