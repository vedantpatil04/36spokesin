import { Link, createFileRoute, createLink } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { forwardRef, type ComponentProps } from "react";
import { ButtonLink } from "@/components/ui-kit";
import { useMyRides } from "@/hooks/use-my-rides";
import { useRiderProfile } from "@/hooks/use-rider-profile";
import { yearOf } from "@/lib/dates";
import { formatRideStart } from "@/lib/ride-format";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useAuthUser } from "@/state/auth";
import { useMyBikes, useMyBikesStatus } from "@/state/garage";

export const Route = createFileRoute("/my-36-spokes/")({
  head: () =>
    seo({
      title: "My 36 Spokes | Rider Home",
      description: "Your 36 Spokes rider home: your motorcycle, your rides and your next journey.",
      path: "/my-36-spokes",
      noIndex: true,
    }),
  component: RiderHome,
});

/** Sections that aren't a primary action; listed quietly under them. */
const moreLinks = [
  { label: "My journeys", to: "/my-36-spokes/journeys" },
  { label: "My travel", to: "/my-36-spokes/travel" },
  { label: "Cart & orders", to: "/my-36-spokes/shop" },
  { label: "My community", to: "/my-36-spokes/community" },
  { label: "My profile", to: "/profile" },
] as const;

// Holds a line's height while its value loads, so nothing shifts when it arrives.
const PLACEHOLDER = " ";

const HomeActionAnchor = forwardRef<
  HTMLAnchorElement,
  ComponentProps<"a"> & { heading: string; detail: string }
>(function HomeActionAnchor({ heading, detail, className, ...props }, ref) {
  return (
    <a
      ref={ref}
      className={cn("group flex items-start justify-between gap-6 py-6 md:py-9", className)}
      {...props}
    >
      <span className="min-w-0">
        <span className="block font-display text-2xl font-semibold uppercase leading-tight transition-colors group-hover:text-primary sm:text-3xl">
          {heading}
        </span>
        <span className="mt-2 block text-sm text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight
        className="mt-1.5 size-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
        aria-hidden
      />
    </a>
  );
});

/** One of the rider home's primary actions: a large typed link with a line of real status. */
const HomeAction = createLink(HomeActionAnchor);

function RiderHome() {
  const user = useAuthUser();
  const riderProfile = useRiderProfile();
  const myRides = useMyRides();
  const bike = useMyBikes()[0] ?? null;
  const bikesStatus = useMyBikesStatus();

  // The shell only renders this route for a signed-in rider.
  if (!user) return null;

  const profile = riderProfile.data;
  const missing = profile
    ? [!user.phone ? "phone number" : null, !profile.city ? "city" : null].filter(
        (item): item is string => item !== null,
      )
    : [];

  // Bookings arrive soonest first and include cancelled ones as history.
  const nextRide =
    myRides.data?.find((entry) => entry.status !== "cancelled" && entry.ride.status !== "completed")
      ?.ride ?? null;

  const bikeDetail = bike
    ? `${bike.bike.brand} ${bike.bike.model}`
    : bikesStatus === "ready"
      ? "No motorcycle added yet"
      : bikesStatus === "error"
        ? "Your garage didn't load"
        : PLACEHOLDER;

  const ridesDetail = nextRide
    ? [
        nextRide.name,
        formatRideStart(nextRide.startsAt),
        nextRide.status === "cancelled" ? "Cancelled" : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : myRides.isPending
      ? PLACEHOLDER
      : myRides.isError
        ? "Your rides didn't load"
        : "No rides joined yet";

  return (
    <>
      <p className="text-sm text-muted-foreground md:text-base">
        {profile
          ? [`Rider since ${yearOf(profile.memberSince)}`, profile.city].filter(Boolean).join(" · ")
          : PLACEHOLDER}
      </p>

      {missing.length > 0 ? (
        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <p className="text-sm text-muted-foreground">
            Your profile is missing your {missing.join(" and ")}.
          </p>
          <ButtonLink to="/profile" search={{ edit: true }} variant="outline" size="sm">
            Complete profile
          </ButtonLink>
        </div>
      ) : null}

      <nav aria-label="Rider home" className="mt-10 border-y border-border md:mt-14">
        <ul className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <li className="md:pr-8">
            <HomeAction to="/my-36-spokes/garage" heading="My bike" detail={bikeDetail} />
          </li>
          <li className="md:px-8">
            <HomeAction to="/my-36-spokes/rides" heading="My rides" detail={ridesDetail} />
          </li>
          <li className="md:pl-8">
            <HomeAction
              to="/plan"
              heading="Plan a journey"
              detail="Routes, fuel stops and day-by-day itineraries"
            />
          </li>
        </ul>
      </nav>

      <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-1">
        {moreLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex h-10 items-center font-display text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
