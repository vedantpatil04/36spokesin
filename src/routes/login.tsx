import { Link, createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button, FormField, TextInput } from "@/components/ui-kit";
import { media } from "@/data/media";
import { seo } from "@/lib/seo";

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
  return (
    <AuthLayout
      image={media.destinations.spiti}
      imageAlt="Motorcycle on a gravel mountain road"
      imageSide="right"
      portalLabel="Rider Access Portal"
      eyebrow="Welcome back"
      title="Rider login"
      note="Accounts are not connected yet — this screen is the frontend foundation."
      footer={
        <>
          New here?{" "}
          <Link to="/join" className="text-primary hover:underline">
            Join 36 Spokes
          </Link>
        </>
      }
    >
      {/* Phase 3 wires this form to Supabase Auth. */}
      <form className="mt-8 space-y-4" onSubmit={(event) => event.preventDefault()}>
        <FormField id="email" label="Email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
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
          />
        </FormField>
        <Button type="submit" size="lg" className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
