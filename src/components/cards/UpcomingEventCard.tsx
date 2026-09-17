import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, BrandCrest, Media } from "@/components/ui-kit";
import { formatDateRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CommunityEvent } from "@/types";
import { cardBase } from "./card-styles";

/**
 * A 36 Spokes-hosted event. Pass `action` for a call to action in the footer,
 * and `detailed` to show meeting point and rider level (used on the Community page).
 */
export function UpcomingEventCard({
  event,
  action,
  detailed = false,
  className,
  id,
}: {
  event: CommunityEvent;
  action?: ReactNode;
  detailed?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <article id={id} className={cn(cardBase, "h-full", className)}>
      <Media asset={event.image} ratio="16/10" imgClassName="group-hover:scale-[1.04]">
        <span className="absolute left-4 top-4">
          <Badge tone="primary" className="bg-background/85 backdrop-blur-sm">
            {event.type}
          </Badge>
        </span>
      </Media>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-primary">
          <time dateTime={event.startDate}>{formatDateRange(event.startDate, event.endDate)}</time>
        </p>
        <h3 className="mt-2 text-xl leading-tight">{event.title}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {event.location}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

        {detailed ? (
          <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                Meeting point
              </dt>
              <dd className="mt-0.5 text-foreground">{event.meetingPoint}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                Who it's for
              </dt>
              <dd className="mt-0.5 text-foreground">{event.level}</dd>
            </div>
          </dl>
        ) : null}

        {/* Grows to align footers across a row, but always leaves breathing room. */}
        <div className="min-h-5 flex-1" aria-hidden />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <BrandCrest className="size-6 shrink-0 ring-1 ring-border" loading="lazy" />
            <span className="truncate">
              <span className="sr-only">Hosted by </span>
              {event.host}
            </span>
          </span>
          {action}
        </div>
      </div>
    </article>
  );
}
