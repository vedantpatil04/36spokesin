import { Link } from "@tanstack/react-router";
import { BrandCrest, BrandWordmark } from "@/components/ui-kit";
import { footerColumns } from "./nav-config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)] md:py-20">
        <div>
          <div className="flex items-center gap-3">
            <BrandCrest className="size-11 ring-1 ring-border/80 shadow-md" loading="lazy" />
            <p className="font-display text-lg tracking-[0.22em]">
              <BrandWordmark />
            </p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Motorcycle travel, gear and rider community. Built around the bike you actually ride.
          </p>
        </div>
        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-xs tracking-[0.22em] text-muted-foreground">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-foreground/80 transition-colors hover:text-primary"
                  >
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
