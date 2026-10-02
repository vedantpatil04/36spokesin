import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { Paragraphs } from "@/components/travel/Paragraphs";
import { ActionGroup, ButtonLink, DetailList, type DetailItem, Section } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getGroupBySlug } from "@/services/community";

export const Route = createFileRoute("/community/groups/$slug")({
  loader: async ({ params }) => {
    const group = await getGroupBySlug(params.slug);
    if (!group) throw notFound();
    return { group };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.group.name} | 36 Spokes Groups`,
          description:
            loaderData.group.description?.slice(0, 160) ??
            `${loaderData.group.name}, a 36 Spokes riding group.`,
          path: `/community/groups/${loaderData.group.slug}`,
          ...(loaderData.group.hasImage ? { image: loaderData.group.image } : {}),
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="group" backTo="/community/groups" backLabel="All groups" />
  ),
  component: GroupPage,
});

function GroupPage() {
  const { group } = Route.useLoaderData();
  const details: DetailItem[] = [
    ...(group.city ? [{ label: "Based in", value: group.city }] : []),
    ...(group.rideCadence ? [{ label: "Rides", value: group.rideCadence }] : []),
    ...(group.memberCount !== null
      ? [{ label: "Members", value: formatNumber(group.memberCount) }]
      : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Group"
        title={group.name}
        description={
          group.city ? `A 36 Spokes group riding from ${group.city}.` : "A 36 Spokes riding group."
        }
        {...(group.hasImage ? { image: group.image, imageAlt: "" } : {})}
      >
        <ButtonLink to="/community/groups" variant="outline">
          All groups
        </ButtonLink>
      </PageHeader>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h2 className="text-3xl leading-tight">About the group</h2>
            {group.description ? (
              <Paragraphs text={group.description} className="mt-5 text-base md:text-lg" />
            ) : (
              <p className="mt-5 text-muted-foreground">More about this group is coming soon.</p>
            )}
          </div>
          <aside className="self-start rounded-sm border border-border bg-card p-6">
            {details.length > 0 ? <DetailList items={details} size="md" /> : null}
            <div className={details.length > 0 ? "mt-8" : undefined}>
              <ActionGroup>
                <ButtonLink to="/rides">Find a ride</ButtonLink>
                <ButtonLink to="/join" variant="outline">
                  Join 36 Spokes
                </ButtonLink>
              </ActionGroup>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
