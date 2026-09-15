import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Media } from "@/components/ui-kit";
import { media } from "@/data/content";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Rider Login | 36 Spokes" },
      { name: "description", content: "Sign in to your 36 Spokes rider account to reach your garage, rides and bookings." },
      { property: "og:title", content: "Rider Login | 36 Spokes" },
      { property: "og:description", content: "Sign in to your 36 Spokes rider account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2">
      <div className="order-2 flex items-center justify-center px-5 py-14 lg:order-1 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <img
              src={media.brandLogo}
              alt="36 Spokes Crest"
              className="size-12 rounded-full object-cover ring-2 ring-primary/40 shadow-md"
            />
            <div>
              <p className="font-display text-sm tracking-[0.2em] text-foreground">36·SPOKES</p>
              <p className="text-xs text-muted-foreground">Rider Access Portal</p>
            </div>
          </div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 text-4xl">Rider login</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Accounts are not connected yet — this screen is the frontend foundation.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div>
              <label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/join" className="text-primary hover:underline">
              Join 36 Spokes
            </Link>
          </p>
        </div>
      </div>
      <Media
        src={media.destSpiti}
        alt="Motorcycle on a gravel mountain road"
        ratio="auto"
        className="order-1 h-56 lg:order-2 lg:h-auto"
      />
    </div>
  );
}
