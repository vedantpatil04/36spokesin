import { Link } from "@tanstack/react-router";
import { Compass, Home, Map, ShoppingBag, Wrench } from "lucide-react";

const tabs = [
  { label: "Home", to: "/", icon: Home },
  { label: "Travel", to: "/travel", icon: Map },
  { label: "Shop", to: "/shop", icon: ShoppingBag },
  { label: "Rides", to: "/rides", icon: Compass },
  { label: "Garage", to: "/garage", icon: Wrench },
] as const;

export function MobileTabBar() {
  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ label, to, icon: Icon }) => (
          <li key={label}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex h-16 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <Icon className="size-5" aria-hidden />
              <span className="font-display text-[0.62rem] uppercase tracking-[0.16em]">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
