import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { StoryCard } from "@/components/cards";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/states";
import { Media, Section, SectionHeader } from "@/components/ui-kit";
import { seo } from "@/lib/seo";
import { listStories } from "@/services/community";

export const Route = createFileRoute("/stories/")({
  loader: async () => ({ stories: await listStories() }),
  head: () =>
    seo({
      title: "Motorcycle Travel Stories & Guides | 36 Spokes",
      description:
        "Rider-written journeys, route notes and preparation guides from Himalayan and Indian motorcycle travel.",
      socialDescription: "Journeys, route notes and preparation guides written by riders.",
      path: "/stories",
    }),
  component: StoriesPage,
});

function StoriesPage() {
  const { stories } = Route.useLoaderData();
  const [lead, ...rest] = stories;

  return (
    <>
      <PageHeader
        eyebrow="Stories"
        title="Written from the saddle"
        description="Long-form journeys, honest route notes and the preparation that made them work."
      />

      {lead ? (
        <Section>
          <article className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <Media
              asset={lead.image}
              alt={lead.title}
              ratio="4/3"
              className="rounded-sm border border-border"
            />
            <div>
              <p className="eyebrow">
                {lead.destination} <span aria-hidden>·</span> {lead.readMinutes} min read
              </p>
              <h2 className="mt-4 text-3xl leading-tight lg:text-4xl">
                <Link to="/stories/$slug" params={{ slug: lead.slug }}>
                  {lead.title}
                </Link>
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">{lead.excerpt}</p>
              <p className="mt-6 text-sm text-muted-foreground">By {lead.rider}</p>
            </div>
          </article>
        </Section>
      ) : (
        <Section>
          <EmptyState
            icon={BookOpen}
            title="No stories published yet"
            description="Ride reports from the community will appear here."
          />
        </Section>
      )}

      {rest.length > 0 ? (
        <Section tone="surface">
          <SectionHeader eyebrow="More reading" title="Recent stories" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((story) => (
              <StoryCard key={story.slug} story={story} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
