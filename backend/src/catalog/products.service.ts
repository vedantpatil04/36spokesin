import { Injectable } from "@nestjs/common";
import { CursorPage } from "../common/http/cursor-page.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ProductStatus } from "../generated/prisma/enums.js";
import { CatalogMapper, productDetailInclude, productSummaryInclude } from "./catalog.mapper.js";
import type { ProductDetailDto, ProductSummaryDto } from "./dto/catalog-response.dto.js";
import type { ProductListQueryDto, ProductSort } from "./dto/product-query.dto.js";

const SORT_ORDER: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ featured: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
  price_asc: [{ price: "asc" }, { id: "asc" }],
  price_desc: [{ price: "desc" }, { id: "desc" }],
  name_asc: [{ name: "asc" }, { id: "asc" }],
};

/** Storefront reads. Only PUBLISHED products are ever returned. */
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CatalogMapper,
  ) {}

  async list(query: ProductListQueryDto): Promise<CursorPage<ProductSummaryDto>> {
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.brand ? { brand: { slug: query.brand } } : {}),
      ...(query.featured !== undefined ? { featured: query.featured } : {}),
      ...(query.bike
        ? {
            compatibility: {
              some: {
                bikeModelId: query.bike,
                ...(query.variant
                  ? { OR: [{ bikeVariantId: null }, { bikeVariantId: query.variant }] }
                  : {}),
              },
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { sku: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.product.findMany({
      where,
      include: productSummaryInclude,
      orderBy: SORT_ORDER[query.sort ?? "newest"],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return CursorPage.fromRows(rows, query.limit, (row) => this.mapper.summary(row));
  }

  async getBySlug(slug: string): Promise<ProductDetailDto> {
    const row = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      include: productDetailInclude,
    });
    if (!row) throw notFound("Product");
    return this.mapper.detail(row);
  }

  /** Other published products in the same category, featured first. */
  async related(slug: string, limit: number): Promise<ProductSummaryDto[]> {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED },
      select: { id: true, categoryId: true },
    });
    if (!product) throw notFound("Product");
    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      include: productSummaryInclude,
      orderBy: SORT_ORDER.newest,
      take: limit,
    });
    return rows.map((row) => this.mapper.summary(row));
  }
}
