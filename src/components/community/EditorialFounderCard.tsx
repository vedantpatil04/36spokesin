import { Instagram, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Founder } from "@/types";

/**
 * Editorial portrait card for the Community founders section.
 * - Shows the real founder image from CMS when available.
 * - Does not use generic mountain/stock photos or AI generated portraits.
 * - Does not show giant wheel/logo placeholder.
 * - Displays compact portrait frame (~260-320px height) showing the face clearly.
 * - Keeps name prominent and supporting text strictly minimal.
 */
export function EditorialFounderCard({
  founder,
  className,
}: {
  founder: Founder;
  className?: string;
}) {
  const initials = founder.name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const links = [
    founder.instagramUrl
      ? { href: founder.instagramUrl, label: "Instagram", icon: Instagram }
      : null,
    founder.linkedinUrl ? { href: founder.linkedinUrl, label: "LinkedIn", icon: Linkedin } : null,
  ].filter((link) => link !== null);

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[4/5] h-[260px] sm:h-[290px] md:h-[320px] w-full overflow-hidden rounded-sm border border-border/80 bg-surface shadow-xs">
        {founder.hasImage && founder.image?.src ? (
          <img
            src={founder.image.src}
            alt={founder.image.alt || `Portrait of ${founder.name}`}
            className="h-full w-full object-cover object-top filter contrast-[1.03] transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-surface-2/40 text-muted-foreground/30">
            <span className="font-display text-4xl sm:text-5xl uppercase tracking-[0.2em] text-foreground/25">
              {initials}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
      </div>

      <div className="mt-3.5 flex flex-col">
        <h3 className="font-display text-xl sm:text-2xl uppercase tracking-[0.12em] text-foreground">
          {founder.name}
        </h3>
        <p className="mt-0.5 font-display text-xs uppercase tracking-[0.2em] text-primary">
          {founder.role || "Founding"}
        </p>

        {founder.shortBio ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {founder.shortBio}
          </p>
        ) : null}

        {founder.quote ? (
          <blockquote className="mt-2.5 border-l-2 border-primary/60 pl-3">
            <p className="text-xs sm:text-sm italic text-foreground/80">“{founder.quote}”</p>
          </blockquote>
        ) : null}

        {links.length > 0 ? (
          <ul className="mt-3 flex gap-2" aria-label={`${founder.name} online`}>
            {links.map(({ href, label, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${founder.name} on ${label} (opens in a new tab)`}
                  className="flex size-8 items-center justify-center rounded-full border border-border/80 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="size-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
