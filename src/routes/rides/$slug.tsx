import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { RideJoinPanel } from "@/components/rides/RideJoinPanel";
import { RideMedia } from "@/components/rides/RideMedia";
import { RideShare } from "@/components/rides/RideShare";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { EntityNotFound, PageSkeleton } from "@/components/states";
import { Badge, Section } from "@/components/ui-kit";
import {
  formatRideDate,
  formatRidePrice,
  formatRideStart,
  formatRideTime,
  parseRideDescription,
  rideAvailability,
  rideDestination,
  rideSeats,
} from "@/lib/ride-format";
import { seo } from "@/lib/seo";
import { getRideBySlug } from "@/services/rides";
import type { RideDetail } from "@/types";

/** "ONE RIDE 2026 — The B'Hive Resort, Londa": the name a shared link carries. */
const shareTitle = (ride: RideDetail) => {
  const destination = rideDestination(ride);
  return destination ? `${ride.name} — ${destination}` : `${ride.name}, ${ride.location}`;
};

/** The ride's own words where it has them, otherwise the facts. */
function metaDescription(ride: RideDetail): string {
  const firstParagraph = parseRideDescription(ride.description).find(
    (block) => block.kind === "text",
  );
  return (
    ride.summary ||
    (firstParagraph?.kind === "text" ? firstParagraph.text : "") ||
    `${ride.type} from ${ride.location} on ${formatRideStart(ride.startsAt)}.`
  );
}

/** Admins write "Included:"; riders read "What's included". */
const listTitle = (title: string) =>
  /^(what'?s\s+)?included$/i.test(title) ? "What's included" : title;

export const Route = createFileRoute("/rides/$slug")({
  // Only rides the API serves publicly resolve here; drafts and archived rides are a 404.
  loader: async ({ params }) => {
    const ride = await getRideBySlug(params.slug);
    if (!ride) throw notFound();
    return { ride };
  },
  head: ({ loaderData }) =>
    loaderData
      ? seo({
          title: `${shareTitle(loaderData.ride)} | 36 Spokes Rides`,
          socialTitle: shareTitle(loaderData.ride),
          description: metaDescription(loaderData.ride),
          path: `/rides/${loaderData.ride.slug}`,
          ...(loaderData.ride.hasImage ? { image: loaderData.ride.image } : {}),
        })
      : {},
  pendingComponent: () => <PageSkeleton layout="detail" />,
  notFoundComponent: () => <EntityNotFound entity="ride" backTo="/rides" backLabel="All rides" />,
  component: RidePage,
});

const sectionTitle = "text-xl sm:text-2xl";

function RidePage() {
  const { ride } = Route.useLoaderData();
  const destination = rideDestination(ride);
  const stops = [ride.route.start, ...ride.route.waypoints, ride.route.finish].filter(
    (stop): stop is string => Boolean(stop),
  );
  const blocks = parseRideDescription(ride.description);
  const about = blocks.filter((block) => block.kind === "text" || block.title === null);
  const lists = blocks.flatMap((block) =>
    block.kind === "list" && block.title !== null ? [{ ...block, title: block.title }] : [],
  );
  const facts: { label: string; value: string; wide?: boolean }[] = [
    { label: "Date", value: formatRideDate(ride.startsAt) },
    { label: "Departure", value: formatRideTime(ride.startsAt) },
    { label: "Meeting point", value: ride.meetingPoint, wide: true },
    ...(ride.route.distanceKm !== null
      ? [{ label: "Distance", value: `${ride.route.distanceKm} km` }]
      : []),
    ...(ride.duration ? [{ label: "Duration", value: ride.duration }] : []),
    { label: "Price", value: formatRidePrice(ride) },
    { label: "Availability", value: rideSeats(ride) },
    { label: "Difficulty", value: ride.difficulty },
    ...(ride.rideLeader ? [{ label: "Ride leader", value: ride.rideLeader }] : []),
  ];

  return (
    <>
      <div className="container-page py-8 md:py-12">
        <Link
          to="/rides"
          className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          All rides
        </Link>

        {/* Phone order: photo, name, facts and booking, then the reading. From lg the facts sit alongside. */}
        <div className="mt-5 grid gap-x-14 gap-y-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <header>
            {ride.hasImage ? (
              <RideMedia
                ride={ride}
                ratio="photo"
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="mb-6 rounded-sm border border-border"
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{ride.type}</Badge>
              {ride.status !== "upcoming" ? (
                <Badge tone="warning">{rideAvailability(ride)}</Badge>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl leading-[1.05] sm:text-4xl lg:text-5xl">{ride.name}</h1>
            {destination ? (
              <p className="mt-2 font-display text-base uppercase tracking-[0.14em] text-muted-foreground sm:text-lg">
                {destination}
              </p>
            ) : null}
            <p className="mt-4 font-display text-sm uppercase tracking-[0.12em] text-primary">
              <time dateTime={ride.startsAt}>{formatRideStart(ride.startsAt)}</time>
              {" · "}
              {ride.location}
              {" · "}
              {formatRidePrice(ride)}
            </p>
            {ride.summary ? (
              <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
                {ride.summary}
              </p>
            ) : null}
          </header>

          <aside
            aria-label="Ride details and booking"
            className="rounded-sm border border-border bg-card p-5 shadow-card sm:p-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
          >
            <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
              {facts.map((fact) => (
                <div key={fact.label} className={fact.wide ? "col-span-2" : undefined}>
                  <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd className="mt-1 font-display text-base uppercase leading-snug text-foreground">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 border-t border-border pt-5">
              <RideJoinPanel ride={ride} />
              <RideShare
                path={`/rides/${ride.slug}`}
                title={shareTitle(ride)}
                text={`${shareTitle(ride)} · ${formatRideStart(ride.startsAt)}`}
              />
            </div>
          </aside>

          <div className="space-y-10">
            {about.length > 0 ? (
              <section aria-labelledby="about-the-ride">
                <h2 id="about-the-ride" className={sectionTitle}>
                  About the ride
                </h2>
                <div className="mt-4 max-w-prose space-y-4 text-sm leading-relaxed text-muted-foreground">
                  {about.map((block, index) =>
                    block.kind === "text" ? (
                      <p key={index} className="whitespace-pre-line">
                        {block.text}
                      </p>
                    ) : (
                      <ul key={index} className="list-disc space-y-1 pl-5">
                        {block.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            {lists.map((list) => (
              <section key={list.title} aria-label={listTitle(list.title)}>
                <h2 className={sectionTitle}>{listTitle(list.title)}</h2>
                <ul className="mt-4 grid gap-x-8 gap-y-2.5 text-sm text-foreground sm:grid-cols-2">
                  {list.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {stops.length > 1 || ride.routeSummary ? (
              <section aria-labelledby="ride-route">
                <h2 id="ride-route" className={sectionTitle}>
                  Route
                </h2>
                {stops.length > 1 ? (
                  <ol
                    aria-label="Route stops"
                    className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2"
                  >
                    {stops.map((stop, index) => (
                      <li key={`${stop}-${index}`} className="flex items-center gap-3">
                        {index > 0 ? <span aria-hidden className="h-px w-5 bg-primary/70" /> : null}
                        <span
                          className={
                            index === 0 || index === stops.length - 1
                              ? "font-display text-sm uppercase tracking-[0.14em] text-foreground"
                              : "text-sm text-muted-foreground"
                          }
                        >
                          {stop}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {ride.routeSummary ? (
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {ride.routeSummary}
                  </p>
                ) : null}
              </section>
            ) : null}

            {ride.destination || ride.trip ? (
              <p className="text-sm text-muted-foreground">
                Part of{" "}
                {ride.destination ? (
                  <Link
                    to="/travel/$destination"
                    params={{ destination: ride.destination.slug }}
                    className="text-foreground hover:text-primary"
                  >
                    {ride.destination.name}
                  </Link>
                ) : null}
                {ride.destination && ride.trip ? " · " : null}
                {ride.trip ? (
                  <Link
                    to="/travel/trips/$slug"
                    params={{ slug: ride.trip.slug }}
                    className="text-foreground hover:text-primary"
                  >
                    {ride.trip.name}
                  </Link>
                ) : null}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {ride.images.length > 1 ? (
        <Section tone="surface" labelledBy="ride-photos" className="py-10 md:py-14">
          <h2 id="ride-photos" className={sectionTitle}>
            Photos
          </h2>
          <div className="mt-6 max-w-3xl">
            <ProductGallery images={ride.images} fallback={ride.image} productName={ride.name} />
          </div>
        </Section>
      ) : null}
    </>
  );
}
