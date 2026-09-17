import { useLocation } from "@tanstack/react-router";
import { CalendarX2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UpcomingEventCard } from "@/components/cards";
import { EmptyState } from "@/components/states";
import type { CommunityEvent } from "@/types";

/**
 * Full event listing. Highlights the event named in the URL hash
 * (/community#event-id), which the homepage links to.
 */
export function EventGrid({ events }: { events: CommunityEvent[] }) {
  // `:target` does not update on client-side navigation, and the hash is unknown
  // during SSR, so the highlight is applied after mount.
  const hash = useLocation({ select: (location) => location.hash });
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  useEffect(() => {
    setLinkedEventId(hash || null);
  }, [hash]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="No events scheduled"
        description="New rides, meetups and workshops are posted here as crews announce them."
        className="mt-10"
      />
    );
  }

  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <li key={event.id}>
          <UpcomingEventCard
            id={event.id}
            event={event}
            detailed
            className={
              event.id === linkedEventId
                ? "scroll-mt-24 border-primary ring-1 ring-primary/40 hover:border-primary"
                : "scroll-mt-24"
            }
          />
        </li>
      ))}
    </ul>
  );
}
