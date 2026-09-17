import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, FormField, TextInput } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { describeAuthError } from "@/services/auth";
import { useAuthActions, useAuthStatus } from "@/state/auth";

export const Route = createFileRoute("/login")({
  head: () =>
    seo({
      title: "Rider Login | 36 Spokes",
      description:
        "Sign in to your 36 Spokes rider account to reach your garage, rides and bookings.",
      socialDescription: "Sign in to your 36 Spokes rider account.",
      path: "/login",
      noIndex: true,
    }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const status = useAuthStatus();
  const { login } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just signed in): head to the member area.
  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/my-36-spokes", replace: true });
  }, [status, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setError(null);
    setIsSubmitting(true);
    login(email, password)
      .then(() => navigate({ to: "/my-36-spokes", replace: true }))
      .catch((submitError: unknown) => setError(describeAuthError(submitError)))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <AuthLayout
      image={media.destinations.spiti}
      imageAlt="Motorcycle on a gravel mountain road"
      imageSide="right"
      portalLabel="Rider Access Portal"
      eyebrow="Welcome back"
      title="Rider login"
      note="Sign in to reach your garage, rides and bookings."
      footer={
        <>
          New here?{" "}
          <Link to="/join" className="text-primary hover:underline">
            Join 36 Spokes
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
        <FormField id="email" label="Email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
          />
        </FormField>
        <FormField id="password" label="Password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={isSubmitting}
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
