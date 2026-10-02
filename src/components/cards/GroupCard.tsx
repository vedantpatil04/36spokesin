import { Link } from "@tanstack/react-router";
import { Media } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";
import { cardBase, stretchedCardFocus, stretchedControl } from "./card-styles";

export function GroupCard({ group }: { group: Group }) {
  const facts = [
    group.memberCount !== null ? `${formatNumber(group.memberCount)} members` : null,
    group.rideCadence,
  ].filter((fact): fact is string => Boolean(fact));

  return (
    <article className={cn(cardBase, stretchedCardFocus, "h-full")}>
      <Media asset={group.image} alt="" ratio="16/10" imgClassName="group-hover:scale-[1.04]" />
      <div className="flex flex-1 flex-col p-5">
        {group.city ? <p className="eyebrow">{group.city}</p> : null}
        <h3 className="mt-2 text-xl leading-tight">
          <Link
            to="/community/groups/$slug"
            params={{ slug: group.slug }}
            className={stretchedControl}
          >
            {group.name}
          </Link>
        </h3>
        {group.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>
        ) : null}
        <div className="min-h-5 flex-1" aria-hidden />
        {facts.length > 0 ? (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            {facts.map((fact, index) => (
              <span key={fact}>
                {index > 0 ? <span aria-hidden> · </span> : null}
                {fact}
              </span>
            ))}
          </p>
        ) : null}
      </div>
    </article>
  );
}
