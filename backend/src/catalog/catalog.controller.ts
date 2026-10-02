import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { CategoryDto, ProductDetailDto, ProductSummaryDto } from "./dto/catalog-response.dto.js";
import { ProductListQueryDto, RelatedProductsQueryDto } from "./dto/product-query.dto.js";
import { ProductsService } from "./products.service.js";
import { TaxonomyService } from "./taxonomy.service.js";

/** Storefront catalogue. Public; only PUBLISHED products are visible. */
@ApiTags("catalogue")
@Public()
@Controller()
export class CatalogController {
  constructor(
    private readonly products: ProductsService,
    private readonly taxonomy: TaxonomyService,
  ) {}

  @Get("products")
  @ApiOperation({ summary: "List published products" })
  @ApiDataResponse(ProductSummaryDto, { paginated: true })
  @ApiErrorResponses(400)
  listProducts(@Query() query: ProductListQueryDto): Promise<CursorPage<ProductSummaryDto>> {
    return this.products.list(query);
  }

  @Get("products/:slug")
  @ApiOperation({ summary: "Get a published product with its gallery, specifications and fitment" })
  @ApiDataResponse(ProductDetailDto)
  @ApiErrorResponses(404)
  getProduct(@Param("slug") slug: string): Promise<ProductDetailDto> {
    return this.products.getBySlug(slug);
  }

  @Get("products/:slug/related")
  @ApiOperation({ summary: "Other published products in the same category" })
  @ApiDataResponse(ProductSummaryDto, { isArray: true })
  @ApiErrorResponses(400, 404)
  related(
    @Param("slug") slug: string,
    @Query() query: RelatedProductsQueryDto,
  ): Promise<ProductSummaryDto[]> {
    return this.products.related(slug, query.limit);
  }

  @Get("categories")
  @ApiOperation({ summary: "List product categories, with published product counts" })
  @ApiDataResponse(CategoryDto, { isArray: true })
  listCategories(): Promise<CategoryDto[]> {
    return this.taxonomy.listCategories({ admin: false });
  }

  @Get("categories/:slug")
  @ApiOperation({ summary: "Get a product category" })
  @ApiDataResponse(CategoryDto)
  @ApiErrorResponses(404)
  getCategory(@Param("slug") slug: string): Promise<CategoryDto> {
    return this.taxonomy.getCategoryBySlug(slug);
  }
}
