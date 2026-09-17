import { FilterChipLink, FilterChipRow, filterLinkBehavior } from "@/components/ui-kit";
import type { RideType, RideTypeSlug } from "@/types";

/** Ride type chips backed by `/rides?type=`. */
export function RideTypeFilter({
  types,
  activeType,
}: {
  types: { slug: RideTypeSlug; label: RideType }[];
  activeType: RideTypeSlug | undefined;
}) {
  return (
    <FilterChipRow label="Ride types">
      <FilterChipLink
        {...filterLinkBehavior}
        to="/rides"
        search={{}}
        active={activeType === undefined}
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
        >
          {type.label}
        </FilterChipLink>
      ))}
    </FilterChipRow>
  );
}
