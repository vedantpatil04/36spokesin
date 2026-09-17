import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { RiderCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { ButtonLink, Section } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listRiders } from "@/services/community";

export const Route = createFileRoute("/community/riders")({
  loader: async () => ({ riders: await listRiders() }),
  head: () =>
    seo({
      title: "Riders | 36 Spokes Community",
      description:
        "Riders on 36 Spokes: their bikes, where they ride from, and the rides they lead.",
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
        title="Riders"
        description="The people posting routes and leading rides, with the bikes they ride and the kilometres they've put on them this year."
      >
        <ButtonLink to="/join" variant="outline">
          Create your rider profile
        </ButtonLink>
      </PageHeader>
      <Section>
        {riders.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No rider profiles yet"
            description="Be the first to add your bike and the roads you ride."
            action={
              <ButtonLink to="/join" variant="outline">
                Join 36 Spokes
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {riders.map((rider) => (
              <RiderCard key={rider.id} rider={rider} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
