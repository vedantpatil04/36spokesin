import { FilterChipLink, FilterChipRow, filterLinkBehavior } from "@/components/ui-kit";
import type { RideType, RideTypeSlug } from "@/types";

/** Smaller than the shop's chips: here the filter sits beside a heading, not above a catalogue. */
const chip = (active: boolean) =>
  active ? "h-8 px-3.5 text-[0.65rem]" : "h-8 border-transparent px-3 text-[0.65rem]";

/** Ride type chips backed by `/rides?type=`. */
export function RideTypeFilter({
  types,
  activeType,
}: {
  types: { slug: RideTypeSlug; label: RideType }[];
  activeType: RideTypeSlug | undefined;
}) {
  return (
    <FilterChipRow label="Ride types" className="gap-1">
      <FilterChipLink
        {...filterLinkBehavior}
        to="/rides"
        search={{}}
        active={activeType === undefined}
        className={chip(activeType === undefined)}
      >
        All
      </FilterChipLink>
      {types.map((type) => (
        <FilterChipLink
          {...filterLinkBehavior}
          key={type.slug}
          to="/rides"
          search={{ type: type.slug }}
          active={type.slug === activeType}
          className={chip(type.slug === activeType)}
        >
          {type.label}
        </FilterChipLink>
      ))}
    </FilterChipRow>
  );
}
