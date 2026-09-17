import { Badge, Media } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import type { Bike } from "@/types";
import { cardBase, stretchedCardFocus, stretchedControl } from "./card-styles";

/** Selectable bike tile. The model name is the control; the whole card is its hit area. */
export function BikeCard({
  bike,
  selected = false,
  onSelect,
}: {
  bike: Bike;
  selected?: boolean;
  onSelect?: (bike: Bike) => void;
}) {
  return (
    <article
      className={cn(
        cardBase,
        "w-full text-left",
        stretchedCardFocus,
        selected && "border-primary ring-1 ring-primary/40",
      )}
    >
      <Media
        asset={bike.image}
        alt={`${bike.brand} ${bike.model}`}
        ratio="4/3"
        imgClassName="group-hover:scale-[1.04]"
      />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
          {bike.brand}
        </p>
        <h3 className="text-lg leading-tight">
          <button
            type="button"
            aria-pressed={selected}
            aria-label={`${bike.brand} ${bike.model}`}
            onClick={() => onSelect?.(bike)}
            className={cn("cursor-pointer text-left uppercase", stretchedControl)}
          >
            {bike.model}
          </button>
        </h3>
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {bike.variant} <span aria-hidden>·</span> {bike.segment}
        </p>
      </div>
      {selected ? (
        <span className="pointer-events-none absolute right-3 top-3">
          <Badge tone="primary">Selected</Badge>
        </span>
      ) : null}
    </article>
  );
}
