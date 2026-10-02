import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { LoadMoreProducts } from "@/components/shop/LoadMoreProducts";
import { ButtonLink } from "@/components/ui-kit";
import type { PaginatedProducts, ProductCategory } from "@/types";

interface CategoryFullPageProps {
  category: ProductCategory;
  page: PaginatedProducts;
  categories: ProductCategory[];
}

/**
 * Full Category page implementation. Preserved here so it can be restored
 * cleanly when Coming Soon mode is removed.
 */
export function CategoryFullPage({ category, page, categories }: CategoryFullPageProps) {
  return (
    <>
      <CategoryFilter categories={categories} activeSlug={category.slug} />
      <LoadMoreProducts
        initial={page}
        filter={{ categorySlug: category.slug }}
        className="mt-8"
        emptyTitle={`No ${category.name.toLowerCase()} gear yet`}
        emptyDescription="New gear for this category is on the way. Browse the other categories in the meantime."
        emptyAction={
          <ButtonLink to="/shop" variant="outline">
            All gear
          </ButtonLink>
        }
      />
    </>
  );
}
