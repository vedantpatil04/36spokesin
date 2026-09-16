import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ButtonLink, Media, Rail, RailItem, Section, SectionHeader } from "@/components/ui-kit";
import { RiderCard, StoryCard, UpcomingEventCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { events, media, riders, rides, stories } from "@/data/content";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Rider Community, Groups & Meets | 36 Spokes" },
      {
        name: "description",
        content: "Meet riders, join local groups, read ride stories and find upcoming rider meets on 36 Spokes.",
      },
      { property: "og:title", content: "Rider Community, Groups & Meets | 36 Spokes" },
      { property: "og:description", content: "Riders, groups, stories and meets from the 36 Spokes community." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  // Highlight the event linked from the homepage (/community#event-id). `:target` does not
  // update on client-side navigation, and the hash is unknown during SSR, so apply it after mount.
  const hash = useLocation({ select: (location) => location.hash });
  const [linkedEventId, setLinkedEventId] = useState<string | null>(null);
  useEffect(() => {
    setLinkedEventId(hash || null);
  }, [hash]);

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="The 36 Spokes rider community"
        description="Riders who post routes, lead weekend runs and answer the questions you'd rather not ask a forum."
        image={media.communityRiders}
        imageAlt="Riders gathered with their motorcycles at a mountain viewpoint"
      />

      <Section id="events" tone="surface" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          eyebrow="Upcoming events"
          title="Ride, meet and learn with 36 Spokes"
          description="Weekend rides, garage nights, workshops and departures hosted by 36 Spokes crews. These are sample listings; registration opens in a later phase."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...events]
            .sort((a, b) => a.startDate.localeCompare(b.startDate))
            .map((event) => (
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
      </Section>

      <Section>
        <SectionHeader eyebrow="Riders" title="People on the road" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {riders.map((rider) => (
            <RiderCard key={rider.id} rider={rider} />
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="Groups & meets"
          title="Ride with people near you"
          action={
            <ButtonLink to="/rides" variant="outline">
              See all rides
            </ButtonLink>
          }
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rides.slice(0, 3).map((ride) => (
            <li key={ride.id} className="rounded-sm border border-border bg-card p-5">
              <p className="eyebrow">{ride.location}</p>
              <h3 className="mt-2 text-xl leading-tight">{ride.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {ride.riders} riders · {ride.duration} · {ride.difficulty}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader eyebrow="Stories" title="From the road" action={<ButtonLink to="/stories" variant="outline">All stories</ButtonLink>} />
        <Rail className="mt-10 md:grid-cols-3">
          {stories.map((story) => (
            <RailItem key={story.slug}>
              <StoryCard story={story} />
            </RailItem>
          ))}
        </Rail>
        <Media
          src={media.communityRiders}
          alt="Riders preparing for a group departure"
          ratio="21/9"
          className="mt-10 rounded-sm border border-border"
        />
      </Section>
    </>
  );
}
