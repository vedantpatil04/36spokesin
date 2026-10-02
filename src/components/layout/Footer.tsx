import { Link } from "@tanstack/react-router";
import { BrandCrest, BrandWordmark } from "@/components/ui-kit";
import { env } from "@/lib/env";
import { footerColumns } from "./nav-config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))] lg:gap-8 xl:gap-10">
          {/* BRAND COLUMN */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 lg:pr-4">
            <Link
              to="/"
              className="inline-flex items-center gap-3 transition-opacity hover:opacity-90"
              aria-label="36 Spokes Home"
            >
              <BrandCrest className="size-10 ring-1 ring-border/80 shadow-md" loading="lazy" />
              <span className="font-display text-base tracking-[0.22em] text-foreground">
                <BrandWordmark />
              </span>
            </Link>
            <p className="mt-3.5 max-w-xs text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Motorcycle travel, gear and rider community. Built around the bike you actually ride.
            </p>
          </div>

          {/* NAVIGATION COLUMNS */}
          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="col-span-1">
              <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {column.title}
              </h2>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-xs sm:text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* FOLLOW COLUMN */}
          <nav aria-label="Follow 36 Spokes" className="col-span-2 sm:col-span-1">
            <h2 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Follow
            </h2>
            <ul className="mt-3.5 space-y-2.5">
              {env.instagramUrl ? (
                <li>
                  <a
                    href={env.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-xs sm:text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    <span>Instagram</span>
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    >
                      →
                    </span>
                  </a>
                </li>
              ) : null}
              {env.whatsappGroupUrl ? (
                <li>
                  <a
                    href={env.whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-xs sm:text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
                    <span>WhatsApp Group</span>
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    >
                      →
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-border/80">
        <div className="container-page flex flex-col gap-2.5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} 36 Spokes. All rights reserved.</p>
          <p className="text-muted-foreground/80">Made for riders, in India.</p>
        </div>
      </div>
    </footer>
  );
}
