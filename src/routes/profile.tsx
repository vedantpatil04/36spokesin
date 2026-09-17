import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, PageSkeleton } from "@/components/states";
import { ButtonLink, FormField, Section, TextInput } from "@/components/ui-kit";
import type { ApiRiderProfile } from "@/lib/api";
import { yearOf } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { getRiderProfile } from "@/services/auth";
import { getMemberOverview } from "@/services/member";
import { useAuthStatus, useAuthUser } from "@/state/auth";

export const Route = createFileRoute("/profile")({
  loader: () => getMemberOverview(),
  head: () =>
    seo({
      title: "My Profile | 36 Spokes",
      description: "Your 36 Spokes rider profile, motorcycles and published stories.",
      path: "/profile",
      noIndex: true,
    }),
  pendingComponent: () => <PageSkeleton layout="detail" />,
  component: ProfilePage,
});

/**
 * Protected client-side, matching `/my-36-spokes` — see that route for why
 * this can't be a `beforeLoad` redirect.
 */
function ProfilePage() {
  const { bikes, stories } = Route.useLoaderData();
  const status = useAuthStatus();
  const user = useAuthUser();
  const navigate = useNavigate();
  const [riderProfile, setRiderProfile] = useState<ApiRiderProfile | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    getRiderProfile()
      .then((result) => {
        if (!cancelled) setRiderProfile(result);
      })
      .catch(() => {
        // No rider profile to show yet — the description falls back below.
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status !== "authenticated" || !user) {
    return <PageSkeleton layout="detail" />;
  }

  const description = riderProfile
    ? [
        `Riding with 36 Spokes since ${yearOf(riderProfile.memberSince)}.`,
        riderProfile.city ? `Based in ${riderProfile.city}.` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : "Loading your rider details.";

  return (
    <>
      <PageHeader
        eyebrow="My profile"
        title={[user.firstName, user.lastName].filter(Boolean).join(" ")}
        description={description}
      >
        <ButtonLink to="/my-36-spokes" variant="outline">
          Back to My 36 Spokes
        </ButtonLink>
      </PageHeader>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <form
            aria-labelledby="rider-details-heading"
            className="rounded-sm border border-border bg-card p-6 md:p-8"
            onSubmit={(event) => event.preventDefault()}
          >
            <h2 id="rider-details-heading" className="text-xl">
              Rider details
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Editing isn't available yet.</p>
            <fieldset disabled className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormField id="profile-first-name" label="First name">
                <TextInput
                  id="profile-first-name"
                  name="firstName"
                  autoComplete="given-name"
                  defaultValue={user.firstName}
                />
              </FormField>
              <FormField id="profile-last-name" label="Last name">
                <TextInput
                  id="profile-last-name"
                  name="lastName"
                  autoComplete="family-name"
                  defaultValue={user.lastName ?? ""}
                />
              </FormField>
              <FormField id="profile-email" label="Email">
                <TextInput
                  id="profile-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={user.email}
                />
              </FormField>
              <FormField id="profile-city" label="City">
                <TextInput
                  key={riderProfile ? "loaded" : "loading"}
                  id="profile-city"
                  name="city"
                  autoComplete="address-level2"
                  defaultValue={riderProfile?.city ?? ""}
                />
              </FormField>
            </fieldset>
          </form>

          <div>
            <h2 className="text-xl">Your motorcycles</h2>
            {bikes.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No motorcycles added yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {bikes.map((garageBike) => (
                  <li
                    key={garageBike.id}
                    className="flex items-center justify-between gap-4 rounded-sm border border-border bg-card p-4"
                  >
                    <div>
                      <Link
                        to="/garage/$bike"
                        params={{ bike: garageBike.bike.slug }}
                        className="font-display text-base uppercase hover:text-primary"
                      >
                        {garageBike.bike.brand} {garageBike.bike.model}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {garageBike.bike.variant} <span aria-hidden>·</span>{" "}
                        {formatNumber(garageBike.odometerKm)} km
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h2 className="mt-10 text-xl">Your stories</h2>
            {stories.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                className="mt-4"
                title="You haven't published a story yet"
                description="Write up a ride or a trip and it will be listed here and on your rider profile."
                action={
                  <ButtonLink to="/stories" variant="outline">
                    Read ride stories
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="mt-4 space-y-2">
                {stories.map((story) => (
                  <li key={story.slug}>
                    <Link
                      to="/stories/$slug"
                      params={{ slug: story.slug }}
                      className="text-sm hover:text-primary"
                    >
                      {story.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
