import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Section, SectionHeader } from "@/components/ui-kit";
import { RideCard } from "@/components/cards";
import { PageHeader } from "@/components/site/PageShell";
import { rides } from "@/data/content";
import { cn } from "@/lib/utils";

const filters = ["All", "Day Ride", "Weekend", "Group Ride", "Event"] as const;

export const Route = createFileRoute("/rides")({
  head: () => ({
    meta: [
      { title: "Weekend Rides, Day Loops & Rider Meets | 36 Spokes" },
      {
        name: "description",
        content: "Discover weekend rides, day loops, group rides and meets, with distance, duration and difficulty.",
      },
      { property: "og:title", content: "Weekend Rides, Day Loops & Rider Meets | 36 Spokes" },
      { property: "og:description", content: "Find your next ride and plan a route with other riders." },
    ],
  }),
  component: RidesPage,
});

function RidesPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const list = filter === "All" ? rides : rides.filter((r) => r.type === filter);

  return (
    <>
      <PageHeader
        eyebrow="Rides"
        title="Find your next ride"
        description="Short rides, weekenders and meets posted by riders. Route planning and maps arrive in a later phase."
      >
        <Button size="lg">Plan a ride</Button>
      </PageHeader>

      <Section>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "h-10 shrink-0 rounded-full border px-4 font-display text-xs uppercase tracking-[0.16em] transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeader
          eyebrow="Coming next"
          title="Route planning"
          description="A map-based route builder with waypoints, fuel stops and elevation will live here. It loads only when opened."
        />
        <div className="mt-8 flex h-64 items-center justify-center rounded-sm border border-dashed border-border-strong bg-surface-2 text-sm text-muted-foreground">
          Map experience reserved for a later phase
        </div>
      </Section>
    </>
  );
}
