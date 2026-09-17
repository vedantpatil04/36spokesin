import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, FormField, SelectInput, TextInput } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { describeAuthError } from "@/services/auth";
import { listBikes } from "@/services/catalog";
import { useAuthActions, useAuthStatus } from "@/state/auth";

export const Route = createFileRoute("/join")({
  loader: async () => ({ bikes: await listBikes() }),
  head: () =>
    seo({
      title: "Join 36 Spokes | Create Your Rider Profile",
      description:
        "Create a 36 Spokes rider profile, add your motorcycle and get gear, rides and trips matched to it.",
      socialDescription: "Add your motorcycle and make the whole platform fit your bike.",
      path: "/join",
    }),
  component: JoinPage,
});

function JoinPage() {
  const { bikes } = Route.useLoaderData();
  const navigate = useNavigate();
  const status = useAuthStatus();
  const { register } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just registered): head to the member area.
  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/my-36-spokes", replace: true });
  }, [status, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const [firstName = name, ...rest] = name.split(/\s+/).filter(Boolean);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setError(null);
    setIsSubmitting(true);
    register({
      email,
      password,
      firstName,
      ...(rest.length > 0 ? { lastName: rest.join(" ") } : {}),
    })
      .then(() => navigate({ to: "/my-36-spokes", replace: true }))
      .catch((submitError: unknown) => setError(describeAuthError(submitError)))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <AuthLayout
      image={media.site.heroRide}
      imageAlt="Rider on a mountain road at sunrise"
      imageSide="left"
      portalLabel="Rider Membership"
      eyebrow="Join 36 Spokes"
      title="Create your rider profile"
      note="Create an account to unlock your garage, rides and bookings."
      footer={
        <>
          Already a member?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p
            role="alert"
            className="rounded-sm border border-destructive/50 px-3 py-2.5 text-sm text-foreground"
          >
            {error}
          </p>
        ) : null}
        <FormField id="name" label="Name">
          <TextInput
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            required
            disabled={isSubmitting}
          />
        </FormField>
        <FormField id="join-email" label="Email">
          <TextInput
            id="join-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
          />
        </FormField>
        <FormField id="join-password" label="Password" hint="At least 8 characters.">
          <TextInput
            id="join-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
            required
            disabled={isSubmitting}
          />
        </FormField>
        <FormField id="bike" label="Your motorcycle">
          <SelectInput id="bike" name="bikeId" disabled={isSubmitting}>
            {bikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.brand} {bike.model}
              </option>
            ))}
          </SelectInput>
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Creating profile
            </>
          ) : (
            "Create profile"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
