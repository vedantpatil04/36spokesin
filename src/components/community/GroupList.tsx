import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Media } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import type { Group } from "@/types";

/** Groups as a list of rows: where each one rides from, how often and (when known) how many. */
export function GroupList({ groups }: { groups: Group[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {groups.map((group) => {
        const facts = [
          group.rideCadence,
          group.memberCount !== null ? `${formatNumber(group.memberCount)} members` : null,
        ].filter((fact): fact is string => Boolean(fact));
        return (
          <li key={group.id} className="group relative">
            <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-center gap-4 py-5 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-6">
              <Media
                asset={group.image}
                alt=""
                ratio="4/3"
                className="rounded-sm border border-border"
              />
              <div className="min-w-0">
                {group.city ? <p className="eyebrow">{group.city}</p> : null}
                <h3 className="mt-1 text-2xl leading-tight">
                  <Link
                    to="/community/groups/$slug"
                    params={{ slug: group.slug }}
                    className="after:absolute after:inset-0 group-hover:text-primary focus-visible:outline-none"
                  >
                    {group.name}
                  </Link>
                </h3>
                {facts.length > 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">{facts.join(" · ")}</p>
                ) : null}
              </div>
              <ArrowUpRight
                className="size-5 text-muted-foreground transition-colors group-hover:text-primary"
                aria-hidden
              />
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-sm group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-ring"
            />
          </li>
        );
      })}
    </ul>
  );
}
