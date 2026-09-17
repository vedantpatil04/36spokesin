import { Link } from "@tanstack/react-router";
import { Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";
import { cardBase } from "./card-styles";

export function StoryCard({ story }: { story: Story }) {
  return (
    <Link
      to="/stories/$slug"
      params={{ slug: story.slug }}
      className={cn(cardBase, "block")}
      aria-label={story.title}
    >
      <Media
        asset={story.image}
        alt={story.title}
        ratio="16/10"
        imgClassName="group-hover:scale-[1.04]"
      />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          {story.destination} <span aria-hidden>·</span> {story.readMinutes} min read
        </p>
        <h3 className="mt-2 text-xl leading-tight">{story.title}</h3>
        <p className="mt-3 text-sm text-muted-foreground">{story.excerpt}</p>
        <p className="mt-4 text-xs text-muted-foreground">By {story.rider}</p>
      </div>
    </Link>
  );
}
