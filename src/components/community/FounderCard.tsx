import { Instagram, Linkedin } from "lucide-react";
import { Paragraphs } from "@/components/travel/Paragraphs";
import { cn } from "@/lib/utils";
import type { Founder } from "@/types";

const firstName = (name: string) => name.split(/\s+/)[0] ?? name;

/**
 * Editorial mention card for 36 Spokes founders on the About page.
 * Focuses on leadership, role, and philosophy without portrait photography.
 */
export function FounderCard({ founder, className }: { founder: Founder; className?: string }) {
  const links = [
    founder.instagramUrl
      ? { href: founder.instagramUrl, label: "Instagram", icon: Instagram }
      : null,
    founder.linkedinUrl ? { href: founder.linkedinUrl, label: "LinkedIn", icon: Linkedin } : null,
  ].filter((link) => link !== null);

  return (
    <article
      className={cn(
        "flex h-full flex-col justify-between rounded-sm border border-border bg-card p-6 md:p-8 transition-colors hover:border-primary/40 shadow-card",
        className,
      )}
    >
      <div>
        <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">
          {founder.role || "Founder"}
        </p>
        <h3 className="mt-2 text-2xl font-normal leading-tight text-foreground sm:text-3xl md:text-4xl">
          {founder.name}
        </h3>
        {founder.shortBio ? (
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            {founder.shortBio}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Co-founder steering the vision, road culture, and rider ecosystem at 36 Spokes.
          </p>
        )}
        {founder.quote ? (
          <blockquote className="mt-6 border-l-2 border-primary pl-4">
            <p className="text-base italic leading-snug text-foreground md:text-lg">
              “{founder.quote}”
            </p>
          </blockquote>
        ) : null}
        {founder.story ? (
          <details className="group/story mt-6 border-t border-border pt-4">
            <summary className="cursor-pointer list-none font-display text-sm uppercase tracking-[0.16em] text-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
              <span className="group-open/story:hidden">
                Read {firstName(founder.name)}'s story
              </span>
              <span className="hidden group-open/story:inline">Hide the story</span>
            </summary>
            <Paragraphs text={founder.story} className="mt-4 text-sm" />
          </details>
        ) : null}
      </div>
      {links.length > 0 ? (
        <ul
          className="mt-6 flex gap-2 border-t border-border/60 pt-4"
          aria-label={`${founder.name} online`}
        >
          {links.map(({ href, label, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${founder.name} on ${label} (opens in a new tab)`}
                className="flex size-10 items-center justify-center rounded-full border border-border-strong text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Icon className="size-4" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
