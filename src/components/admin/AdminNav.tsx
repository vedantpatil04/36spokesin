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
} from "lucide-react";

const items = [
  { to: "/admin/hero", label: "Hero slides", icon: Sliders },
  { to: "/admin/paths", label: "Path cards", icon: LayoutGrid },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/categories", label: "Categories & brands", icon: Tags },
  { to: "/admin/bikes", label: "Bikes", icon: Bike },
  { to: "/admin/destinations", label: "Destinations", icon: MapPinned },
  { to: "/admin/trips", label: "Trips", icon: CalendarDays },
  { to: "/admin/rides", label: "Rides", icon: Route },
  { to: "/admin/payments", label: "Payments", icon: IndianRupee },
  { to: "/admin/social", label: "Social feed", icon: Instagram },
  { to: "/admin/community/founders", label: "Founders", icon: UserRound },
  { to: "/admin/community/stories", label: "Stories", icon: BookOpen },
  { to: "/admin/community/riders", label: "Rider spotlights", icon: Users },
  { to: "/admin/community/groups", label: "Groups", icon: UsersRound },
  { to: "/admin/media", label: "Media library", icon: Images },
] as const;

/** Section navigation for the CMS: a column on desktop, a scrolling row on tablet. */
export function AdminNav() {
  return (
    <nav aria-label="Admin sections">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="shrink-0">
            <Link
              to={to}
              className="flex h-11 items-center gap-3 rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              activeProps={{ className: "bg-surface text-foreground", "aria-current": "page" }}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
