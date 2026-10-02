import { Injectable } from "@nestjs/common";
import { CatalogMapper } from "../catalog/catalog.mapper.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { AdminBikeModelDto, BikeModelDto } from "./dto/bike-response.dto.js";

export const bikeModelInclude = (options: { activeVariantsOnly: boolean }) =>
  ({
    brand: { select: { id: true, slug: true, name: true } },
    image: true,
    variants: {
      ...(options.activeVariantsOnly ? { where: { archivedAt: null } } : {}),
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    },
  }) satisfies Prisma.BikeModelInclude;

export const adminBikeModelInclude = {
  ...bikeModelInclude({ activeVariantsOnly: false }),
  _count: { select: { riderBikes: true, compatibility: true } },
} satisfies Prisma.BikeModelInclude;

export type BikeModelRow = Prisma.BikeModelGetPayload<{
  include: ReturnType<typeof bikeModelInclude>;
}>;
export type AdminBikeModelRow = Prisma.BikeModelGetPayload<{
  include: typeof adminBikeModelInclude;
}>;

@Injectable()
export class BikeMapper {
  constructor(private readonly catalog: CatalogMapper) {}

  model(row: BikeModelRow): BikeModelDto {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: { id: row.brand.id, slug: row.brand.slug, name: row.brand.name },
      segment: row.segment,
      description: row.description,
      displacementCc: row.displacementCc,
      fuelEfficiencyKmpl: row.fuelEfficiencyKmpl,
      tankLitres: row.tankLitres,
      image: row.image
        ? this.catalog.image(row.image, row.image.altText ?? `${row.brand.name} ${row.name}`)
        : null,
      variants: row.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sortOrder: variant.sortOrder,
        archivedAt: variant.archivedAt,
      })),
    };
  }

  adminModel(row: AdminBikeModelRow): AdminBikeModelDto {
    return {
      ...this.model(row),
      archivedAt: row.archivedAt,
      riderCount: row._count.riderBikes,
      productCount: row._count.compatibility,
      updatedAt: row.updatedAt,
    };
  }
}
