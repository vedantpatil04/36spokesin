import { Link } from "@tanstack/react-router";
import { memberNav } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

/** Section navigation for My 36 Spokes sub-pages: one underlined row that swipes on narrow screens. */
export function MemberNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Member sections"
      className={cn(
        "no-scrollbar -mx-5 overflow-x-auto border-b border-border px-5 md:mx-0 md:px-0",
        className,
      )}
    >
      <ul className="flex gap-7">
        {memberNav.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex h-11 shrink-0 items-center whitespace-nowrap border-b border-transparent font-display text-xs uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
