import { FilterChipLink, FilterChipRow, filterLinkBehavior } from "@/components/ui-kit";
import type { ProductCategory, ProductCategorySlug } from "@/types";

/** Category chips backed by the URL: /shop and /shop/$category. */
export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: ProductCategory[];
  activeSlug: ProductCategorySlug | null;
}) {
  const active = categories.find((category) => category.slug === activeSlug);
  return (
    <>
      <FilterChipRow label="Product categories" className="mt-6">
        <FilterChipLink {...filterLinkBehavior} to="/shop" active={activeSlug === null}>
          All
        </FilterChipLink>
        {categories.map((category) => (
          <FilterChipLink
            {...filterLinkBehavior}
            key={category.slug}
            to="/shop/$category"
            params={{ category: category.slug }}
            active={category.slug === activeSlug}
          >
            {category.name}
          </FilterChipLink>
        ))}
      </FilterChipRow>
      <p className="mt-3 text-sm text-muted-foreground">
        {active
          ? `${active.name}: ${active.purpose}.`
          : "Categories built around what the gear does on a ride, not around brand names."}
      </p>
    </>
  );
}
