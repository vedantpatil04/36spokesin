import { Media } from "@/components/ui-kit";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Group } from "@/types";
import { cardBase } from "./card-styles";

export function GroupCard({ group }: { group: Group }) {
  return (
    <article className={cn(cardBase, "h-full")}>
      <Media asset={group.image} alt="" ratio="16/10" imgClassName="group-hover:scale-[1.04]" />
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{group.city}</p>
        <h3 className="mt-2 text-xl leading-tight">{group.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{group.description}</p>
        <div className="min-h-5 flex-1" aria-hidden />
        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          {formatNumber(group.memberCount)} members <span aria-hidden>·</span> {group.rideCadence}
        </p>
      </div>
    </article>
  );
}
