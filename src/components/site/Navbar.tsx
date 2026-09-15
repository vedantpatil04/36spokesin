import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui-kit";
import { media } from "@/data/content";

export const primaryNav = [
  { label: "Garage", to: "/garage" },
  { label: "Travel", to: "/travel" },
  { label: "Shop", to: "/shop" },
  { label: "Rides", to: "/rides" },
  { label: "Community", to: "/community" },
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link
          to="/"
          className="group flex items-center gap-2.5 font-display text-lg tracking-[0.22em] lg:text-xl"
          aria-label="36 Spokes home"
        >
          <img
            src={media.brandLogo}
            alt="36 Spokes Logo"
            className="size-8.5 rounded-full object-cover ring-1 ring-border/80 transition-all duration-300 group-hover:scale-105 group-hover:ring-primary/80 lg:size-10"
          />
          <span className="flex items-center">
            36<span className="text-primary">·</span>SPOKES
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {primaryNav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            className="flex size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-[1.15rem]" aria-hidden />
          </button>
          <Link
            to="/shop"
            aria-label="Cart"
            className="flex size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ShoppingBag className="size-[1.15rem]" aria-hidden />
          </Link>
          <Link
            to="/my-36-spokes"
            aria-label="My 36 Spokes"
            className="hidden size-10 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
          >
            <User className="size-[1.15rem]" aria-hidden />
          </Link>
          <ButtonLink to="/login" variant="outline" size="sm" className="hidden lg:inline-flex">
            Login
          </ButtonLink>
          <ButtonLink to="/join" size="sm" className="hidden lg:inline-flex">
            Join
          </ButtonLink>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex size-10 items-center justify-center rounded-sm text-foreground lg:hidden"
          >
            {menuOpen ? <Menu className="size-5 hidden" aria-hidden /> : null}
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label="Mobile menu" className="border-t border-border bg-surface lg:hidden">
          <ul className="container-page flex flex-col py-2">
            {[...primaryNav, { label: "Stories", to: "/stories" }, { label: "My 36 Spokes", to: "/my-36-spokes" }].map(
              (item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="flex h-12 items-center font-display text-sm uppercase tracking-[0.2em] text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
            <li className="flex gap-3 py-3">
              <ButtonLink to="/login" variant="outline" className="flex-1" onClick={() => setMenuOpen(false)}>
                Login
              </ButtonLink>
              <ButtonLink to="/join" className="flex-1" onClick={() => setMenuOpen(false)}>
                Join
              </ButtonLink>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
