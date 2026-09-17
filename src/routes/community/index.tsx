import { createFileRoute } from "@tanstack/react-router";
import { RiderCard, StoryCard } from "@/components/cards";
import { EventGrid } from "@/components/events/EventGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ActionGroup,
  ButtonLink,
  Media,
  Rail,
  RailItem,
  Section,
  SectionHeader,
} from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { listEvents, listRiders, listStories } from "@/services/community";
import { listRides } from "@/services/rides";

export const Route = createFileRoute("/community/")({
  loader: async () => {
    const [events, riders, rides, stories] = await Promise.all([
      listEvents(),
      listRiders(),
      listRides(),
      listStories(),
    ]);
    return { events, riders, rides: rides.slice(0, 3), stories };
  },
  head: () =>
    seo({
      title: "Rider Community, Groups & Meets | 36 Spokes",
      description:
        "Meet riders, join local groups, read ride stories and find upcoming rider meets on 36 Spokes.",
      socialDescription: "Riders, groups, stories and meets from the 36 Spokes community.",
      path: "/community",
    }),
  component: CommunityPage,
});

function CommunityPage() {
  const { events, riders, rides, stories } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="The 36 Spokes rider community"
        description="Riders who post routes, lead weekend runs and answer the questions you'd rather not ask a forum."
        image={media.riders.community}
        imageAlt="Riders gathered with their motorcycles at a mountain viewpoint"
      />

      <Section id="events" tone="surface" className="scroll-mt-16 lg:scroll-mt-20">
        <SectionHeader
          eyebrow="Upcoming events"
          title="Ride, meet and learn with 36 Spokes"
          description="Weekend rides, garage nights, workshops and departures hosted by 36 Spokes crews. These are sample listings; registration opens in a later phase."
        />
        <EventGrid events={events} />
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Riders"
          title="People on the road"
          action={
            <ButtonLink to="/community/riders" variant="outline">
              All riders
            </ButtonLink>
          }
        />
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
            <ActionGroup>
              <ButtonLink to="/community/groups" variant="outline">
                All groups
              </ButtonLink>
              <ButtonLink to="/rides" variant="outline">
                See all rides
              </ButtonLink>
            </ActionGroup>
          }
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rides.map((ride) => (
            <li key={ride.id} className="rounded-sm border border-border bg-card p-5">
              <p className="eyebrow">{ride.location}</p>
              <h3 className="mt-2 text-xl leading-tight">{ride.name}</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                {ride.riders} riders <span aria-hidden>·</span> {ride.duration}{" "}
                <span aria-hidden>·</span> {ride.difficulty}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeader
          eyebrow="Stories"
          title="From the road"
          action={
            <ButtonLink to="/stories" variant="outline">
              All stories
            </ButtonLink>
          }
        />
        <Rail className="mt-10 md:grid-cols-3">
          {stories.map((story) => (
            <RailItem key={story.slug}>
              <StoryCard story={story} />
            </RailItem>
          ))}
        </Rail>
        <Media
          asset={media.riders.community}
          alt="Riders preparing for a group departure"
          ratio="21/9"
          className="mt-10 rounded-sm border border-border"
        />
      </Section>
    </>
  );
}
