import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, type FormEvent, type ReactNode } from "react";
import { PageSkeleton, Skeleton } from "@/components/states";
import {
  Button,
  ButtonLink,
  FormField,
  Media,
  TextInput,
  fieldLabelClasses,
} from "@/components/ui-kit";
import { media } from "@/data/media";
import { useAccountAction } from "@/hooks/use-account-action";
import { useRiderProfile, useSaveRiderProfile } from "@/hooks/use-rider-profile";
import type { ApiRiderProfile, ApiUser } from "@/lib/api";
import { yearOf } from "@/lib/dates";
import { formatNumber } from "@/lib/format";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useAuthActions, useAuthStatus, useAuthUser } from "@/state/auth";
import { useMyBikes, useMyBikesStatus } from "@/state/garage";
import type { GarageBike } from "@/types";

export const Route = createFileRoute("/profile")({
  // `?edit=true` opens the rider details for editing, so Back leaves edit mode.
  validateSearch: (search: Record<string, unknown>): { edit?: true } =>
    search["edit"] === true || search["edit"] === "true" ? { edit: true } : {},
  head: () =>
    seo({
      title: "My Profile | 36 Spokes",
      description: "Your 36 Spokes rider profile and motorcycle.",
      path: "/profile",
      noIndex: true,
    }),
  component: ProfilePage,
});

/**
 * The rider's own profile: who they are, their details and their motorcycle.
 * Everything else in the account lives under `/my-36-spokes`.
 *
 * Protected client-side, matching `/my-36-spokes` — see that route for why
 * this can't be a `beforeLoad` redirect.
 */
function ProfilePage() {
  const { edit } = Route.useSearch();
  const status = useAuthStatus();
  const user = useAuthUser();
  const navigate = useNavigate();
  const riderProfile = useRiderProfile();
  const bikes = useMyBikes();
  const bikesStatus = useMyBikesStatus();

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated" || !user) {
    return <PageSkeleton layout="detail" />;
  }

  const profile = riderProfile.data;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const editing = edit === true;

  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">My profile</p>
        <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5 sm:gap-6">
            <RiderAvatar user={user} src={profile?.avatar?.url ?? null} />
            <div className="min-w-0">
              <h1 className="break-words text-3xl leading-[1.05] sm:text-5xl">{fullName}</h1>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                {profile ? `Rider since ${yearOf(profile.memberSince)}` : " "}
              </p>
            </div>
          </div>
          {editing ? null : (
            <ButtonLink
              to="/profile"
              search={{ edit: true }}
              variant="outline"
              className="shrink-0 self-start sm:self-auto"
            >
              Edit profile
            </ButtonLink>
          )}
        </div>

        <ProfileSection id="rider-details-heading" title="Rider details">
          {riderProfile.isError ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">Your rider details didn't load.</p>
              <Button variant="outline" size="sm" onClick={() => void riderProfile.refetch()}>
                Try again
              </Button>
            </div>
          ) : !profile ? (
            <Skeleton className="h-40 w-full" />
          ) : editing ? (
            <RiderDetailsForm
              user={user}
              profile={profile}
              onDone={() => void navigate({ to: "/profile", search: {}, replace: true })}
            />
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-10">
              <Detail label="First name" value={user.firstName} />
              <Detail label="Last name" value={user.lastName} />
              <Detail label="Phone" value={user.phone} wide />
              <Detail label="Email" value={user.email} wide />
              <Detail label="City" value={profile.city} wide />
            </dl>
          )}
        </ProfileSection>

        <ProfileSection id="my-motorcycle-heading" title="My motorcycle">
          {bikes[0] ? (
            <MotorcycleSummary garageBike={bikes[0]} otherCount={bikes.length - 1} />
          ) : bikesStatus === "ready" ? (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <p className="text-sm text-muted-foreground">No motorcycle added yet.</p>
              <ButtonLink to="/my-36-spokes/garage" variant="outline" size="sm">
                Add your bike
              </ButtonLink>
            </div>
          ) : bikesStatus === "error" ? (
            <p className="text-sm text-muted-foreground">Your garage didn't load.</p>
          ) : (
            <Skeleton className="h-20 w-full max-w-md" />
          )}
        </ProfileSection>
      </div>
    </div>
  );
}

function ProfileSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="mt-10 grid gap-6 border-t border-border pt-10 md:mt-12 md:grid-cols-[13rem_1fr] md:gap-10 md:pt-12"
    >
      <h2 id={id} className="text-xl">
        {title}
      </h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** The rider's photo when they have one, otherwise their initials. */
function RiderAvatar({ user, src }: { user: ApiUser; src: string | null }) {
  const frame = "size-16 shrink-0 rounded-full sm:size-20";
  if (src) {
    return <img src={src} alt="" className={cn(frame, "object-cover ring-1 ring-border")} />;
  }
  const initials = [user.firstName, user.lastName]
    .map((name) => name?.trim().charAt(0) ?? "")
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        frame,
        "flex items-center justify-center border border-border-strong bg-surface font-display text-xl text-primary sm:text-2xl",
      )}
    >
      {initials}
    </span>
  );
}

/** `wide` values (they can be long) take the full row on narrow screens. */
function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2 sm:col-span-1")}>
      <dt className={fieldLabelClasses}>{label}</dt>
      <dd
        className={cn(
          "mt-1.5 break-words text-base",
          value ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {value || "Not added"}
      </dd>
    </div>
  );
}

function RiderDetailsForm({
  user,
  profile,
  onDone,
}: {
  user: ApiUser;
  profile: ApiRiderProfile;
  onDone: () => void;
}) {
  const { updateAccount } = useAuthActions();
  const saveRiderProfile = useSaveRiderProfile();
  const { run, pending, error } = useAccountAction();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();

    void run(async () => {
      await updateAccount({
        firstName: text("firstName"),
        lastName: text("lastName") || null,
        phone: text("phone") || null,
      });
      await saveRiderProfile({ city: text("city") || null });
      return true;
    }).then((saved) => {
      if (saved) onDone();
    });
  };

  return (
    <form aria-labelledby="rider-details-heading" onSubmit={handleSubmit}>
      {error ? (
        <p
          role="alert"
          className="mb-6 rounded-sm border border-destructive/50 px-3 py-2.5 text-sm text-foreground"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
        <FormField id="profile-first-name" label="First name">
          <TextInput
            id="profile-first-name"
            name="firstName"
            autoComplete="given-name"
            defaultValue={user.firstName}
            maxLength={100}
            required
            disabled={pending}
          />
        </FormField>
        <FormField id="profile-last-name" label="Last name">
          <TextInput
            id="profile-last-name"
            name="lastName"
            autoComplete="family-name"
            defaultValue={user.lastName ?? ""}
            maxLength={100}
            disabled={pending}
          />
        </FormField>
        <FormField id="profile-phone" label="Phone" hint="With country code, e.g. +91 98765 43210.">
          <TextInput
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={user.phone ?? ""}
            aria-describedby="profile-phone-hint"
            disabled={pending}
          />
        </FormField>
        {/* The sign-in email can't be changed here, so it's shown rather than offered as a field. */}
        <div className="min-w-0">
          <p className={fieldLabelClasses}>Email</p>
          <p className="mt-2 flex min-h-12 items-center break-all text-sm text-foreground">
            {user.email}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">Used to sign in.</p>
        </div>
        <FormField id="profile-city" label="City">
          <TextInput
            id="profile-city"
            name="city"
            autoComplete="address-level2"
            defaultValue={profile.city ?? ""}
            maxLength={100}
            disabled={pending}
          />
        </FormField>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Saving
            </>
          ) : (
            "Save changes"
          )}
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** The rider's main bike, with a way to edit it in My Garage and to see the model. */
function MotorcycleSummary({
  garageBike,
  otherCount,
}: {
  garageBike: GarageBike;
  otherCount: number;
}) {
  const { bike } = garageBike;
  const name = `${bike.brand} ${bike.model}`;
  const facts = [
    garageBike.variantName,
    garageBike.year ? String(garageBike.year) : null,
    garageBike.odometerKm !== null ? `${formatNumber(garageBike.odometerKm)} km` : null,
  ].filter(Boolean);
  // Models without a photo carry the catalogue placeholder; the summary reads better without it.
  const hasPhoto = bike.image.src !== media.placeholders.bike.src;

  return (
    <div className="flex items-start gap-4 sm:items-center sm:gap-7">
      {hasPhoto ? (
        <Media
          asset={bike.image}
          alt={name}
          ratio="4/3"
          sizes="(min-width: 640px) 14rem, 7rem"
          className="w-28 shrink-0 rounded-sm sm:w-56"
        />
      ) : null}
      <div className="min-w-0">
        {garageBike.nickname ? <p className="eyebrow mb-2">{garageBike.nickname}</p> : null}
        <h3 className="break-words text-xl sm:text-2xl">{name}</h3>
        {facts.length > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">{facts.join(" · ")}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ButtonLink to="/my-36-spokes/garage" variant="outline" size="sm">
            Edit
          </ButtonLink>
          {garageBike.archived ? null : (
            <ButtonLink to="/garage/$bike" params={{ bike: bike.slug }} variant="ghost" size="sm">
              View
            </ButtonLink>
          )}
        </div>
        {otherCount > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">+{otherCount} more in your garage</p>
        ) : null}
      </div>
    </div>
  );
}
