import { Link } from "@tanstack/react-router";
import { memberNav } from "@/components/layout/nav-config";

/** Section navigation for My 36 Spokes: a swipe row on mobile, a sidebar on desktop. */
export function MemberNav() {
  return (
    <nav
      aria-label="Member sections"
      className="no-scrollbar -mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-2 lg:flex-col lg:gap-1">
        {memberNav.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex h-10 w-full shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-left font-display text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-surface-2 data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
