import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory, ProductStatus } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { CatalogMapper } from "./catalog.mapper.js";
import type { BrandDto, CategoryDto } from "./dto/catalog-response.dto.js";
import type {
  CreateBrandDto,
  CreateCategoryDto,
  UpdateBrandDto,
  UpdateCategoryDto,
} from "./dto/taxonomy-input.dto.js";
import { resolveSlug } from "./unique-slug.js";

const CATEGORY_IMAGE_CATEGORIES = [MediaCategory.PRODUCT, MediaCategory.SITE] as const;

const categoryInclude = (publishedOnly: boolean) =>
  ({
    image: true,
    _count: {
      select: {
        products: publishedOnly ? { where: { status: ProductStatus.PUBLISHED } } : true,
      },
    },
  }) satisfies Prisma.ProductCategoryInclude;

type CategoryRow = Prisma.ProductCategoryGetPayload<{
  include: ReturnType<typeof categoryInclude>;
}>;

/** Product categories and brands: public reads plus admin management. */
@Injectable()
export class TaxonomyService {
  private readonly logger = new Logger(TaxonomyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: CatalogMapper,
  ) {}

  // ─── Categories ──────────────────────────────────────────────────────────

  async listCategories(options: { admin: boolean }): Promise<CategoryDto[]> {
    const rows = await this.prisma.productCategory.findMany({
      include: categoryInclude(!options.admin),
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map((row) => this.toCategory(row));
  }

  async getCategoryBySlug(slug: string): Promise<CategoryDto> {
    const row = await this.prisma.productCategory.findUnique({
      where: { slug },
      include: categoryInclude(true),
    });
    if (!row) throw notFound("Category");
    return this.toCategory(row);
  }

  async createCategory(admin: AuthUser, dto: CreateCategoryDto): Promise<CategoryDto> {
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "category",
      isTaken: async (candidate) =>
        (await this.prisma.productCategory.count({ where: { slug: candidate } })) > 0,
    });
    if (dto.imageMediaId)
      await this.media.assertAttachable(dto.imageMediaId, CATEGORY_IMAGE_CATEGORIES);

    const row = await this.prisma.productCategory.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description ?? null,
        sortOrder: dto.sortOrder ?? 0,
        imageMediaId: dto.imageMediaId ?? null,
      },
      include: categoryInclude(false),
    });
    this.logger.log({ adminId: admin.id, categoryId: row.id }, "Category created");
    return this.toCategory(row);
  }

  async updateCategory(admin: AuthUser, id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    const existing = await this.prisma.productCategory.findUnique({ where: { id } });
    if (!existing) throw notFound("Category");

    if (dto.slug && dto.slug !== existing.slug) {
      await resolveSlug({
        requested: dto.slug,
        name: existing.name,
        entity: "category",
        isTaken: async (candidate) =>
          (await this.prisma.productCategory.count({ where: { slug: candidate } })) > 0,
      });
    }
    if (dto.imageMediaId)
      await this.media.assertAttachable(dto.imageMediaId, CATEGORY_IMAGE_CATEGORIES);

    const row = await this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
        ...(dto.imageMediaId !== undefined ? { imageMediaId: dto.imageMediaId } : {}),
      },
      include: categoryInclude(false),
    });

    if (existing.imageMediaId && existing.imageMediaId !== row.imageMediaId) {
      await this.media.releaseIfUnreferenced(existing.imageMediaId);
    }
    this.logger.log({ adminId: admin.id, categoryId: id }, "Category updated");
    return this.toCategory(row);
  }

  /** Only empty categories can be deleted; products (even archived ones) keep theirs. */
  async deleteCategory(admin: AuthUser, id: string): Promise<void> {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw notFound("Category");
    if (existing._count.products > 0) {
      throw inUse(
        `This category still holds ${existing._count.products} product${existing._count.products === 1 ? "" : "s"}. Move them to another category first.`,
      );
    }
    await this.prisma.productCategory.delete({ where: { id } });
    if (existing.imageMediaId) await this.media.releaseIfUnreferenced(existing.imageMediaId);
    this.logger.log({ adminId: admin.id, categoryId: id }, "Category deleted");
  }

  // ─── Brands ──────────────────────────────────────────────────────────────

  async listBrands(): Promise<BrandDto[]> {
    const rows = await this.prisma.productBrand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      productCount: row._count.products,
    }));
  }

  async createBrand(admin: AuthUser, dto: CreateBrandDto): Promise<BrandDto> {
    await this.assertBrandNameFree(dto.name);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "brand",
      isTaken: async (candidate) =>
        (await this.prisma.productBrand.count({ where: { slug: candidate } })) > 0,
    });
    const row = await this.prisma.productBrand.create({ data: { name: dto.name, slug } });
    this.logger.log({ adminId: admin.id, brandId: row.id }, "Brand created");
    return { id: row.id, slug: row.slug, name: row.name, productCount: 0 };
  }

  async updateBrand(admin: AuthUser, id: string, dto: UpdateBrandDto): Promise<BrandDto> {
    const existing = await this.prisma.productBrand.findUnique({ where: { id } });
    if (!existing) throw notFound("Brand");
    if (dto.name && dto.name !== existing.name) await this.assertBrandNameFree(dto.name);
    if (dto.slug && dto.slug !== existing.slug) {
      await resolveSlug({
        requested: dto.slug,
        name: existing.name,
        entity: "brand",
        isTaken: async (candidate) =>
          (await this.prisma.productBrand.count({ where: { slug: candidate } })) > 0,
      });
    }
    const row = await this.prisma.productBrand.update({
      where: { id },
      data: { ...(dto.name ? { name: dto.name } : {}), ...(dto.slug ? { slug: dto.slug } : {}) },
      include: { _count: { select: { products: true } } },
    });
    this.logger.log({ adminId: admin.id, brandId: id }, "Brand updated");
    return { id: row.id, slug: row.slug, name: row.name, productCount: row._count.products };
  }

  async deleteBrand(admin: AuthUser, id: string): Promise<void> {
    const existing = await this.prisma.productBrand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw notFound("Brand");
    if (existing._count.products > 0) {
      throw inUse(
        `${existing._count.products} product${existing._count.products === 1 ? " uses" : "s use"} this brand. Change their brand first.`,
      );
    }
    await this.prisma.productBrand.delete({ where: { id } });
    this.logger.log({ adminId: admin.id, brandId: id }, "Brand deleted");
  }

  private async assertBrandNameFree(name: string): Promise<void> {
    const clash = await this.prisma.productBrand.count({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (clash > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        "A brand with this name already exists.",
        [{ field: "name", messages: ["name is already in use"] }],
      );
    }
  }

  private toCategory(row: CategoryRow): CategoryDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      sortOrder: row.sortOrder,
      image: row.image ? this.mapper.image(row.image) : null,
      productCount: row._count.products,
    };
  }
}

function inUse(message: string): ApiException {
  return new ApiException(HttpStatus.CONFLICT, ErrorCode.RESOURCE_IN_USE, message);
}
