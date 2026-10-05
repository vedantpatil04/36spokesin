import { Link, useLocation } from "@tanstack/react-router";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect } from "react";
import { BrandCrest } from "@/components/ui-kit";
import { ADMIN_NAV_SECTIONS } from "./AdminNav";

export function AdminDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = useLocation({ select: (location) => location.pathname });

  // Close when pathname changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog" aria-label="Admin Navigation Drawer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[18rem] xs:max-w-xs flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Drawer header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            to="/admin/products"
            onClick={onClose}
            className="flex items-center gap-2.5 font-display text-sm tracking-[0.2em] text-foreground"
          >
            <BrandCrest className="size-7.5 ring-1 ring-border/80" />
            <div className="flex flex-col">
              <span className="font-semibold leading-tight tracking-[0.18em]">36 SPOKES</span>
              <span className="text-[0.62rem] uppercase tracking-[0.2em] text-primary">Admin CMS</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin menu"
            className="flex size-10 items-center justify-center rounded-sm border border-border/60 bg-surface/60 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground active:scale-95"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Drawer navigation */}
        <nav aria-label="Admin mobile navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                {section.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onClose}
                      className="flex h-11 items-center gap-3 rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground active:bg-surface"
                      activeProps={{
                        className: "bg-primary/10 font-medium text-primary",
                        "aria-current": "page",
                      }}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="shrink-0 border-t border-border p-3 bg-surface/30">
          <Link
            to="/"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-between rounded-sm border border-border/80 bg-surface px-3 text-xs font-display uppercase tracking-[0.16em] text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            <span>View Live Site</span>
            <ArrowUpRight className="size-3.5 text-primary" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
