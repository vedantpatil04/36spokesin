import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Media } from "@/components/ui-kit";
import { bikes, media } from "@/data/content";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join 36 Spokes | Create Your Rider Profile" },
      {
        name: "description",
        content: "Create a 36 Spokes rider profile, add your motorcycle and get gear, rides and trips matched to it.",
      },
      { property: "og:title", content: "Join 36 Spokes | Create Your Rider Profile" },
      { property: "og:description", content: "Add your motorcycle and make the whole platform fit your bike." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  return (
    <div className="grid lg:min-h-[calc(100svh-5rem)] lg:grid-cols-2">
      <Media
        src={media.heroRide}
        alt="Rider on a mountain road at sunrise"
        ratio="auto"
        className="h-56 lg:h-auto"
      />
      <div className="flex items-center justify-center px-5 py-14 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-3">
            <img
              src={media.brandLogo}
              alt="36 Spokes Crest"
              className="size-12 rounded-full object-cover ring-2 ring-primary/40 shadow-md"
            />
            <div>
              <p className="font-display text-sm tracking-[0.2em] text-foreground">36·SPOKES</p>
              <p className="text-xs text-muted-foreground">Rider Membership</p>
            </div>
          </div>
          <p className="eyebrow">Join 36 Spokes</p>
          <h1 className="mt-2 text-4xl">Create your rider profile</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Sign-up is not connected to an account system yet.
          </p>

          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </label>
              <input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                className="mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label htmlFor="join-email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Email
              </label>
              <input
                id="join-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label htmlFor="bike" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Your motorcycle
              </label>
              <select
                id="bike"
                className="mt-2 h-12 w-full rounded-sm border border-input bg-surface px-3 text-sm text-foreground"
              >
                {bikes.map((bike) => (
                  <option key={bike.id} value={bike.id}>
                    {bike.brand} {bike.model}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="lg" className="w-full">
              Create profile
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
