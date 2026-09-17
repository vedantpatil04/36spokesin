import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { StoryCard } from "@/components/cards";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { ButtonLink, Media, Section, SectionHeader } from "@/components/ui-kit";
import { formatLongDate, parseISODate } from "@/lib/dates";
import { seo } from "@/lib/seo";
import { getStoryBySlug, listMoreStories } from "@/services/community";

export const Route = createFileRoute("/stories/$slug")({
  loader: async ({ params }) => {
    const story = await getStoryBySlug(params.slug);
    if (!story) throw notFound();
    const more = await listMoreStories(story.slug);
    return { story, more };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${loaderData.story.title} | 36 Spokes Stories`,
          description: loaderData.story.excerpt,
          path: `/stories/${loaderData.story.slug}`,
          image: loaderData.story.image,
          type: "article",
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => (
    <EntityNotFound entity="story" backTo="/stories" backLabel="All stories" />
  ),
  component: StoryPage,
});

function StoryPage() {
  const { story, more } = Route.useLoaderData();
  const published = parseISODate(story.publishedAt);

  return (
    <>
      <article>
        <header className="container-page pb-10 pt-12 md:pb-14 md:pt-16">
          <nav aria-label="Breadcrumb">
            <Link
              to="/stories"
              className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              Stories
            </Link>
          </nav>
          <p className="eyebrow mt-8">
            {story.destination} <span aria-hidden>·</span> {story.readMinutes} min read
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
            {story.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {story.excerpt}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            By {story.rider}
            {published ? (
              <>
                {" "}
                <span aria-hidden>·</span>{" "}
                <time dateTime={story.publishedAt}>{formatLongDate(published)}</time>
              </>
            ) : null}
          </p>
        </header>
        <div className="container-page">
          <Media
            asset={story.image}
            alt={story.title}
            ratio="21/9"
            className="rounded-sm border border-border"
            priority
          />
        </div>
        <div className="container-page py-12 md:py-16">
          <div className="max-w-2xl space-y-6 text-base leading-relaxed text-foreground/90 md:text-lg">
            {story.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
          {story.destinationSlug ? (
            <ButtonLink
              to="/travel/$destination"
              params={{ destination: story.destinationSlug }}
              variant="outline"
              className="mt-10"
            >
              Ride {story.destination} with 36 Spokes
            </ButtonLink>
          ) : null}
        </div>
      </article>

      {more.length > 0 ? (
        <Section tone="surface">
          <SectionHeader eyebrow="Keep reading" title="More from the road" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((entry) => (
              <StoryCard key={entry.slug} story={entry} />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
