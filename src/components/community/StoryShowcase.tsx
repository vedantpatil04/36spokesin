import { Link } from "@tanstack/react-router";
import { Media } from "@/components/ui-kit";
import type { Story } from "@/types";

function StoryMeta({ story }: { story: Story }) {
  return (
    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
      {story.destination ? (
        <>
          {story.destination} <span aria-hidden>·</span>{" "}
        </>
      ) : null}
      {story.readMinutes} min read
    </p>
  );
}

/** The lead story as a large editorial feature, with up to three more beside it. */
export function StoryShowcase({ stories }: { stories: Story[] }) {
  const [lead, ...rest] = stories;
  if (!lead) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
      <article className="group">
        <Media
          asset={lead.image}
          alt={lead.hasImage === false ? "" : lead.title}
          ratio="4/3"
          className="rounded-sm border border-border"
          imgClassName="group-hover:scale-[1.03]"
        />
        <div className="mt-6">
          <StoryMeta story={lead} />
          <h3 className="mt-3 text-3xl leading-[1.05] md:text-4xl">
            <Link to="/stories/$slug" params={{ slug: lead.slug }} className="hover:text-primary">
              {lead.title}
            </Link>
          </h3>
          {lead.excerpt ? (
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              {lead.excerpt}
            </p>
          ) : null}
          {lead.rider ? (
            <p className="mt-4 text-sm text-muted-foreground">By {lead.rider}</p>
          ) : null}
        </div>
      </article>

      {rest.length > 0 ? (
        <ol
          aria-label="More stories"
          className="divide-y divide-border self-start border-y border-border"
        >
          {rest.slice(0, 3).map((story) => (
            <li
              key={story.slug}
              className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 py-5 sm:grid-cols-[8rem_minmax(0,1fr)]"
            >
              <Media
                asset={story.image}
                alt=""
                ratio="4/3"
                className="rounded-sm border border-border"
              />
              <div className="min-w-0">
                <StoryMeta story={story} />
                <h3 className="mt-1.5 text-lg leading-tight">
                  <Link
                    to="/stories/$slug"
                    params={{ slug: story.slug }}
                    className="hover:text-primary"
                  >
                    {story.title}
                  </Link>
                </h3>
                {story.excerpt ? (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {story.excerpt}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
