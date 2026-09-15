import { Link } from "@tanstack/react-router";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Travel", to: "/travel" },
      { label: "Rides", to: "/rides" },
      { label: "Stories", to: "/stories" },
      { label: "Community", to: "/community" },
    ],
  },
  {
    title: "Ride & Gear",
    links: [
      { label: "Shop", to: "/shop" },
      { label: "Garage", to: "/garage" },
      { label: "My 36 Spokes", to: "/my-36-spokes" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Join 36 Spokes", to: "/join" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-20">
        <div>
          <p className="font-display text-lg tracking-[0.22em]">
            36<span className="text-primary">·</span>SPOKES
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Motorcycle travel, gear and rider community. Built around the bike you actually ride.
          </p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-xs tracking-[0.22em] text-muted-foreground">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-foreground/80 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-border py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} 36 Spokes. Placeholder development content.</p>
        <p>Made for riders, in India.</p>
      </div>
    </footer>
  );
}
