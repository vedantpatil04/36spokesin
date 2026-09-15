import { createFileRoute } from "@tanstack/react-router";
import { Media, Section, SectionHeader } from "@/components/ui-kit";
import { StoryCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { stories } from "@/data/content";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Motorcycle Travel Stories & Guides | 36 Spokes" },
      {
        name: "description",
        content: "Rider-written journeys, route notes and preparation guides from Himalayan and Indian motorcycle travel.",
      },
      { property: "og:title", content: "Motorcycle Travel Stories & Guides | 36 Spokes" },
      { property: "og:description", content: "Journeys, route notes and preparation guides written by riders." },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  const lead = stories[0]!;
  const rest = stories.slice(1);

  return (
    <>
      <PageHeader
        eyebrow="Stories"
        title="Written from the saddle"
        description="Long-form journeys, honest route notes and the preparation that made them work."
      />

      <Section>
        <article className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <Media src={lead.image} alt={lead.title} ratio="4/3" className="rounded-sm border border-border" />
          <div>
            <p className="eyebrow">
              {lead.destination} · {lead.readMinutes} min read
            </p>
            <h2 className="mt-4 text-3xl leading-tight lg:text-4xl">{lead.title}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{lead.excerpt}</p>
            <p className="mt-6 text-sm text-muted-foreground">By {lead.rider}</p>
          </div>
        </article>
      </Section>

      <Section tone="surface">
        <SectionHeader eyebrow="More reading" title="Recent stories" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((story) => (
            <StoryCard key={story.slug} story={story} />
          ))}
        </div>
      </Section>
    </>
  );
}
