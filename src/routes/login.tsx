import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, FormField, PasswordInput, TextInput } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";
import { describeAuthError } from "@/services/auth";
import { useAuthActions, useAuthStatus, useAuthUser } from "@/state/auth";

/**
 * `redirect` returns the rider to where they were (e.g. a product they tried to
 * add to their cart). Only same-site paths are accepted.
 */
function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//"))
    return undefined;
  if (value.startsWith("/login") || value.startsWith("/join")) return undefined;
  return value;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeRedirect(search["redirect"]);
    return redirect ? { redirect } : {};
  },
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
  const { redirect } = Route.useSearch();
  const status = useAuthStatus();
  const user = useAuthUser();
  const { login } = useAuthActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (or just signed in): return to where the user was, or their role-specific area.
  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (redirect) {
      void navigate({ to: redirect as never, replace: true });
    } else if (user.role === "ADMIN") {
      void navigate({ to: "/admin/products", replace: true });
    } else {
      void navigate({ to: "/my-36-spokes", replace: true });
    }
  }, [status, user, navigate, redirect]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setError(null);
    setIsSubmitting(true);
    login(email, password)
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
          <PasswordInput
            id="password"
            name="password"
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
