import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { RiderSpotlightCard } from "@/components/community/RiderSpotlightCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listRiderSpotlights } from "@/services/community";

export const Route = createFileRoute("/community/riders")({
  loader: async () => ({ riders: await listRiderSpotlights() }),
  head: () =>
    seo({
      title: "Rider Spotlights | 36 Spokes Community",
      description:
        "Riders featured by 36 Spokes: the bikes they ride, where they ride from and their favourite roads.",
      path: "/community/riders",
    }),
  component: RidersPage,
});

function RidersPage() {
  const { riders } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Rider spotlights"
        description="Riders featured by 36 Spokes, in their own words: the bike, the home roads and the ride they'd do again tomorrow."
      >
        <ButtonLink to="/community" variant="outline">
          Back to Community
        </ButtonLink>
      </PageHeader>
      <Section>
        {riders.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No rider spotlights yet"
            description="Riders featured by 36 Spokes will appear here."
            action={
              <ButtonLink to="/join" variant="outline">
                Join 36 Spokes
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {riders.map((rider) => (
              <li key={rider.id}>
                <RiderSpotlightCard rider={rider} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
