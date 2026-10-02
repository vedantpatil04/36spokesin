import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { resolveSlug, slugTaken, invalidReference } from "../catalog/unique-slug.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { MediaCategory } from "../generated/prisma/enums.js";
import { MediaService } from "../media/media.service.js";
import { BikeMapper, adminBikeModelInclude, bikeModelInclude } from "./bike.mapper.js";
import type {
  CreateBikeBrandDto,
  CreateBikeModelDto,
  CreateBikeVariantDto,
  UpdateBikeBrandDto,
  UpdateBikeModelDto,
  UpdateBikeVariantDto,
} from "./dto/bike-input.dto.js";
import type { AdminBikeModelDto, BikeBrandDto, BikeModelDto } from "./dto/bike-response.dto.js";

const BIKE_MEDIA = [MediaCategory.BIKE] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Active = neither the model nor its brand is archived. */
const activeModelWhere: Prisma.BikeModelWhereInput = {
  archivedAt: null,
  brand: { archivedAt: null },
};

/**
 * Bike catalogue (brand → model → variant). Public reads see active entries only;
 * admins create, edit, archive and restore. Nothing is hard-deleted, because
 * riders' garages and product fitment point at these rows.
 */
@Injectable()
export class BikesService {
  private readonly logger = new Logger(BikesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    private readonly mapper: BikeMapper,
  ) {}

  // ─── Public ──────────────────────────────────────────────────────────────

  async listActive(brandSlug?: string): Promise<BikeModelDto[]> {
    const rows = await this.prisma.bikeModel.findMany({
      where: {
        ...activeModelWhere,
        ...(brandSlug ? { brand: { slug: brandSlug, archivedAt: null } } : {}),
      },
      include: bikeModelInclude({ activeVariantsOnly: true }),
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    });
    return rows.map((row) => this.mapper.model(row));
  }

  /** By id or slug. */
  async getActive(identifier: string): Promise<BikeModelDto> {
    const row = await this.prisma.bikeModel.findFirst({
      where: {
        ...activeModelWhere,
        ...(UUID_PATTERN.test(identifier) ? { id: identifier } : { slug: identifier }),
      },
      include: bikeModelInclude({ activeVariantsOnly: true }),
    });
    if (!row) throw notFound("Motorcycle");
    return this.mapper.model(row);
  }

  // ─── Admin: brands ───────────────────────────────────────────────────────

  async listBrands(): Promise<BikeBrandDto[]> {
    const rows = await this.prisma.bikeBrand.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { name: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      archivedAt: row.archivedAt,
      modelCount: row._count.models,
    }));
  }

  async createBrand(admin: AuthUser, dto: CreateBikeBrandDto): Promise<BikeBrandDto> {
    await this.assertBrandNameFree(dto.name);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: dto.name,
      entity: "bike brand",
      isTaken: async (candidate) =>
        (await this.prisma.bikeBrand.count({ where: { slug: candidate } })) > 0,
    });
    const row = await this.prisma.bikeBrand.create({ data: { name: dto.name, slug } });
    this.logger.log({ adminId: admin.id, bikeBrandId: row.id }, "Bike brand created");
    return { id: row.id, slug: row.slug, name: row.name, archivedAt: null, modelCount: 0 };
  }

  async updateBrand(admin: AuthUser, id: string, dto: UpdateBikeBrandDto): Promise<BikeBrandDto> {
    const existing = await this.prisma.bikeBrand.findUnique({ where: { id } });
    if (!existing) throw notFound("Bike brand");
    if (dto.name && dto.name !== existing.name) await this.assertBrandNameFree(dto.name);
    if (dto.slug && dto.slug !== existing.slug) {
      if ((await this.prisma.bikeBrand.count({ where: { slug: dto.slug } })) > 0)
        throw slugTaken("bike brand");
    }
    const row = await this.prisma.bikeBrand.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...archiveChange(dto.archived, existing.archivedAt),
      },
      include: { _count: { select: { models: true } } },
    });
    this.logger.log(
      { adminId: admin.id, bikeBrandId: id, archived: row.archivedAt !== null },
      "Bike brand updated",
    );
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      archivedAt: row.archivedAt,
      modelCount: row._count.models,
    };
  }

  // ─── Admin: models ───────────────────────────────────────────────────────

  async listModels(brandId?: string): Promise<AdminBikeModelDto[]> {
    const rows = await this.prisma.bikeModel.findMany({
      where: brandId ? { brandId } : {},
      include: adminBikeModelInclude,
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    });
    return rows.map((row) => this.mapper.adminModel(row));
  }

  async getModel(id: string): Promise<AdminBikeModelDto> {
    const row = await this.prisma.bikeModel.findUnique({
      where: { id },
      include: adminBikeModelInclude,
    });
    if (!row) throw notFound("Motorcycle");
    return this.mapper.adminModel(row);
  }

  async createModel(admin: AuthUser, dto: CreateBikeModelDto): Promise<AdminBikeModelDto> {
    const brand = await this.prisma.bikeBrand.findUnique({ where: { id: dto.brandId } });
    if (!brand) throw invalidReference("brandId", "The selected bike brand does not exist.");
    await this.assertModelNameFree(dto.brandId, dto.name);
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, BIKE_MEDIA);
    const slug = await resolveSlug({
      requested: dto.slug,
      name: `${brand.name} ${dto.name}`,
      entity: "motorcycle",
      isTaken: (candidate) => this.modelSlugTaken(candidate),
    });
    const variantNames = uniqueNames(dto.variants ?? []);

    const row = await this.prisma.bikeModel.create({
      data: {
        brandId: dto.brandId,
        name: dto.name,
        slug,
        segment: dto.segment,
        description: dto.description ?? null,
        displacementCc: dto.displacementCc ?? null,
        fuelEfficiencyKmpl: dto.fuelEfficiencyKmpl ?? null,
        tankLitres: dto.tankLitres ?? null,
        imageMediaId: dto.imageMediaId ?? null,
        variants: { create: variantNames.map((name, index) => ({ name, sortOrder: index })) },
      },
      include: adminBikeModelInclude,
    });
    this.logger.log({ adminId: admin.id, bikeModelId: row.id }, "Bike model created");
    return this.mapper.adminModel(row);
  }

  async updateModel(
    admin: AuthUser,
    id: string,
    dto: UpdateBikeModelDto,
  ): Promise<AdminBikeModelDto> {
    const existing = await this.prisma.bikeModel.findUnique({ where: { id } });
    if (!existing) throw notFound("Motorcycle");
    const brandId = dto.brandId ?? existing.brandId;
    if (dto.brandId && dto.brandId !== existing.brandId) {
      const brand = await this.prisma.bikeBrand.count({ where: { id: dto.brandId } });
      if (!brand) throw invalidReference("brandId", "The selected bike brand does not exist.");
    }
    if ((dto.name && dto.name !== existing.name) || brandId !== existing.brandId) {
      await this.assertModelNameFree(brandId, dto.name ?? existing.name, id);
    }
    if (dto.slug && dto.slug !== existing.slug && (await this.modelSlugTaken(dto.slug))) {
      throw slugTaken("motorcycle");
    }
    if (dto.imageMediaId) await this.media.assertAttachable(dto.imageMediaId, BIKE_MEDIA);

    const row = await this.prisma.bikeModel.update({
      where: { id },
      data: {
        ...(dto.brandId ? { brandId: dto.brandId } : {}),
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.slug ? { slug: dto.slug } : {}),
        ...(dto.segment ? { segment: dto.segment } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.displacementCc !== undefined ? { displacementCc: dto.displacementCc } : {}),
        ...(dto.fuelEfficiencyKmpl !== undefined
          ? { fuelEfficiencyKmpl: dto.fuelEfficiencyKmpl }
          : {}),
        ...(dto.tankLitres !== undefined ? { tankLitres: dto.tankLitres } : {}),
        ...(dto.imageMediaId !== undefined ? { imageMediaId: dto.imageMediaId } : {}),
        ...archiveChange(dto.archived, existing.archivedAt),
      },
      include: adminBikeModelInclude,
    });
    if (existing.imageMediaId && existing.imageMediaId !== row.imageMediaId) {
      await this.media.releaseIfUnreferenced(existing.imageMediaId);
    }
    this.logger.log(
      { adminId: admin.id, bikeModelId: id, fields: Object.keys(dto) },
      "Bike model updated",
    );
    return this.mapper.adminModel(row);
  }

  async archiveModel(admin: AuthUser, id: string): Promise<AdminBikeModelDto> {
    return this.updateModel(admin, id, { archived: true });
  }

  // ─── Admin: variants ─────────────────────────────────────────────────────

  async createVariant(
    admin: AuthUser,
    modelId: string,
    dto: CreateBikeVariantDto,
  ): Promise<AdminBikeModelDto> {
    const model = await this.prisma.bikeModel.count({ where: { id: modelId } });
    if (!model) throw notFound("Motorcycle");
    await this.assertVariantNameFree(modelId, dto.name);
    const count = await this.prisma.bikeVariant.count({ where: { modelId } });
    await this.prisma.bikeVariant.create({
      data: { modelId, name: dto.name, sortOrder: dto.sortOrder ?? count },
    });
    this.logger.log({ adminId: admin.id, bikeModelId: modelId }, "Bike variant created");
    return this.getModel(modelId);
  }

  async updateVariant(
    admin: AuthUser,
    modelId: string,
    variantId: string,
    dto: UpdateBikeVariantDto,
  ): Promise<AdminBikeModelDto> {
    const variant = await this.prisma.bikeVariant.findFirst({ where: { id: variantId, modelId } });
    if (!variant) throw notFound("Variant");
    if (dto.name && dto.name !== variant.name)
      await this.assertVariantNameFree(modelId, dto.name, variantId);
    await this.prisma.bikeVariant.update({
      where: { id: variantId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.sortOrder !== undefined && dto.sortOrder !== null
          ? { sortOrder: dto.sortOrder }
          : {}),
        ...archiveChange(dto.archived, variant.archivedAt),
      },
    });
    this.logger.log(
      { adminId: admin.id, bikeModelId: modelId, bikeVariantId: variantId },
      "Bike variant updated",
    );
    return this.getModel(modelId);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async modelSlugTaken(slug: string): Promise<boolean> {
    return (await this.prisma.bikeModel.count({ where: { slug } })) > 0;
  }

  private async assertBrandNameFree(name: string): Promise<void> {
    const clash = await this.prisma.bikeBrand.count({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (clash) throw nameTaken("A bike brand with this name already exists.");
  }

  private async assertModelNameFree(
    brandId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const clash = await this.prisma.bikeModel.count({
      where: {
        brandId,
        name: { equals: name, mode: "insensitive" },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    if (clash) throw nameTaken("This brand already has a model with this name.");
  }

  private async assertVariantNameFree(
    modelId: string,
    name: string,
    exceptId?: string,
  ): Promise<void> {
    const clash = await this.prisma.bikeVariant.count({
      where: {
        modelId,
        name: { equals: name, mode: "insensitive" },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
    if (clash) throw nameTaken("This model already has a variant with this name.");
  }
}

function archiveChange(archived: boolean | undefined, current: Date | null) {
  if (archived === true && current === null) return { archivedAt: new Date() };
  if (archived === false && current !== null) return { archivedAt: null };
  return {};
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function nameTaken(message: string): ApiException {
  return new ApiException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message, [
    { field: "name", messages: ["name is already in use"] },
  ]);
}
