import { Link } from "@tanstack/react-router";
import {
  Bike,
  BookOpen,
  Boxes,
  CalendarDays,
  Images,
  IndianRupee,
  Instagram,
  LayoutGrid,
  MapPinned,
  Route,
  Sliders,
  Tags,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavSection = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    title: "CONTENT",
    items: [
      { to: "/admin/hero", label: "Hero slides", icon: Sliders },
      { to: "/admin/paths", label: "Path cards", icon: LayoutGrid },
    ],
  },
  {
    title: "CATALOG",
    items: [
      { to: "/admin/products", label: "Products", icon: Boxes },
      { to: "/admin/categories", label: "Categories & brands", icon: Tags },
      { to: "/admin/bikes", label: "Bikes", icon: Bike },
    ],
  },
  {
    title: "TRAVEL",
    items: [
      { to: "/admin/destinations", label: "Destinations", icon: MapPinned },
      { to: "/admin/trips", label: "Trips", icon: CalendarDays },
      { to: "/admin/rides", label: "Rides", icon: Route },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/admin/payments", label: "Payments", icon: IndianRupee },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { to: "/admin/social", label: "Social feed", icon: Instagram },
      { to: "/admin/community/founders", label: "Founders", icon: UserRound },
      { to: "/admin/community/stories", label: "Stories", icon: BookOpen },
      { to: "/admin/community/riders", label: "Rider spotlights", icon: Users },
      { to: "/admin/community/groups", label: "Groups", icon: UsersRound },
    ],
  },
  {
    title: "MEDIA",
    items: [
      { to: "/admin/media", label: "Media library", icon: Images },
    ],
  },
];

/** Section navigation for the CMS desktop sidebar. */
export function AdminNav({ onSelect }: { onSelect?: () => void }) {
  return (
    <nav aria-label="Admin sections" className="space-y-4">
      {ADMIN_NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onSelect}
                  className="flex h-9 items-center gap-2.5 rounded-sm px-3 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  activeProps={{ className: "bg-surface font-medium text-foreground", "aria-current": "page" }}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
