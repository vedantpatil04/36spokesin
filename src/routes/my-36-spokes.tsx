import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, ButtonLink, Media, Section } from "@/components/ui-kit";
import { ProductCard, RideCard, TripCard } from "@/components/cards";
import { bikes, formatINR, media, products, rides, setupChecklist, trips } from "@/data/content";
import { cn } from "@/lib/utils";

const sections = [
  "Dashboard",
  "My Garage",
  "My Bikes",
  "My Gear",
  "My Rides",
  "My Routes",
  "My Travel",
  "My Bookings",
  "My Orders",
  "My Groups",
  "My Stories",
  "My Profile",
] as const;

export const Route = createFileRoute("/my-36-spokes")({
  head: () => ({
    meta: [
      { title: "My 36 Spokes | Rider Dashboard" },
      {
        name: "description",
        content: "Your motorcycle, gear, rides, routes, trips, bookings and orders in one rider dashboard.",
      },
      { property: "og:title", content: "My 36 Spokes | Rider Dashboard" },
      { property: "og:description", content: "Your bike, gear, rides and trips in one place." },
    ],
  }),
  component: MemberPage,
});

function MemberPage() {
  const [active, setActive] = useState<(typeof sections)[number]>("Dashboard");
  const bike = bikes[0]!;

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">My 36 Spokes</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">Evening, Ankit</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preview of the member experience — signed-in data is not connected yet.
          </p>
        </div>
        <ButtonLink to="/join" variant="outline">
          Complete your profile
        </ButtonLink>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Member sections" className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {sections.map((section) => (
              <li key={section}>
                <button
                  type="button"
                  onClick={() => setActive(section)}
                  aria-current={active === section ? "page" : undefined}
                  className={cn(
                    "h-10 w-full shrink-0 whitespace-nowrap rounded-sm px-3 text-left font-display text-xs uppercase tracking-[0.16em] transition-colors",
                    active === section
                      ? "bg-surface-2 text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {section}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <article className="overflow-hidden rounded-sm border border-border bg-card">
              <Media src={media.productLuggage} alt={`${bike.brand} ${bike.model}`} ratio="16/9" />
              <div className="p-5">
                <p className="eyebrow">My bike</p>
                <h2 className="mt-2 text-2xl">
                  {bike.brand} {bike.model}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {bike.variant} · 18,420 km · Service due in 1,580 km
                </p>
              </div>
            </article>

            <div className="grid gap-4">
              <article className="rounded-sm border border-border bg-card p-5">
                <p className="eyebrow">Upcoming ride</p>
                <h2 className="mt-2 text-xl">{rides[1]!.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rides[1]!.location} · {rides[1]!.distanceKm} km · {rides[1]!.duration}
                </p>
              </article>
              <article className="rounded-sm border border-border bg-card p-5">
                <p className="eyebrow">Upcoming trip</p>
                <h2 className="mt-2 text-xl">{trips[0]!.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {trips[0]!.dates} · {formatINR(trips[0]!.price)} · {trips[0]!.seatsLeft} seats left
                </p>
              </article>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-sm border border-border bg-card p-5">
              <h2 className="text-lg">Setup readiness</h2>
              <ul className="mt-4 space-y-2.5">
                {setupChecklist.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span>{item.label}</span>
                    {item.status === "ready" ? (
                      <Badge tone="success">Ready</Badge>
                    ) : (
                      <Badge tone="warning">Missing</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-sm border border-border bg-card p-5">
              <h2 className="text-lg">Recent activity</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li>Order #10428 packed — Expedition Aluminium Pannier Set</li>
                <li>Joined group ride: Sahyadri Ghat Weekender</li>
                <li>Saved route: Konkan Coast Run</li>
                <li>Enquiry sent: Spiti Circuit, October departure</li>
              </ul>
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-lg">Recommended gear for your bike</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg">Saved rides & trips</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <RideCard ride={rides[3]!} />
              <TripCard trip={trips[1]!} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
