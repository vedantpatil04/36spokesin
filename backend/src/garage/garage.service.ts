import { HttpStatus, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { BikeMapper, bikeModelInclude } from "../bikes/bike.mapper.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  type CreateRiderBikeDto,
  EARLIEST_MODEL_YEAR,
  MAX_BIKES_PER_RIDER,
  type RiderBikeDto,
  type UpdateRiderBikeDto,
} from "./dto/rider-bike.dto.js";

const riderBikeInclude = {
  bikeModel: { include: { ...bikeModelInclude({ activeVariantsOnly: true }), brand: true } },
  bikeVariant: { select: { id: true, name: true } },
} satisfies Prisma.RiderBikeInclude;

type RiderBikeRow = Prisma.RiderBikeGetPayload<{ include: typeof riderBikeInclude }>;

/**
 * A rider's own motorcycles. Stored on the server so the garage survives
 * refreshes, sign-outs and deployments. Changes to the primary bike lock the
 * rider's user row, so two tabs can never leave two primaries (the partial
 * unique index is the backstop).
 */
@Injectable()
export class GarageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bikes: BikeMapper,
  ) {}

  async list(user: AuthUser): Promise<RiderBikeDto[]> {
    const rows = await this.prisma.riderBike.findMany({
      where: { userId: user.id },
      include: riderBikeInclude,
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    return rows.map((row) => this.toResponse(row));
  }

  async get(user: AuthUser, id: string): Promise<RiderBikeDto> {
    return this.toResponse(await this.findOwn(this.prisma, user, id));
  }

  async create(user: AuthUser, dto: CreateRiderBikeDto): Promise<RiderBikeDto> {
    this.assertYear(dto.year);
    const id = await this.prisma.$transaction(async (tx) => {
      await this.lockRider(tx, user);
      await this.assertSelectable(tx, dto.bikeModelId, dto.bikeVariantId ?? null);
      const existing = await tx.riderBike.count({ where: { userId: user.id } });
      if (existing >= MAX_BIKES_PER_RIDER) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.LIMIT_REACHED,
          `A garage can hold up to ${MAX_BIKES_PER_RIDER} motorcycles.`,
        );
      }
      const primary = existing === 0 || dto.isPrimary === true;
      if (primary) await this.clearPrimary(tx, user);
      const created = await tx.riderBike.create({
        data: {
          userId: user.id,
          bikeModelId: dto.bikeModelId,
          bikeVariantId: dto.bikeVariantId ?? null,
          nickname: dto.nickname ?? null,
          year: dto.year ?? null,
          odometerKm: dto.odometerKm ?? null,
          isPrimary: primary,
        },
        select: { id: true },
      });
      return created.id;
    });
    return this.get(user, id);
  }

  async update(user: AuthUser, id: string, dto: UpdateRiderBikeDto): Promise<RiderBikeDto> {
    this.assertYear(dto.year);
    await this.prisma.$transaction(async (tx) => {
      await this.lockRider(tx, user);
      const current = await this.findOwn(tx, user, id);
      const modelId = dto.bikeModelId ?? current.bikeModelId;
      const modelChanged = modelId !== current.bikeModelId;
      // Changing the model drops a variant that belonged to the old one.
      const variantId =
        dto.bikeVariantId !== undefined
          ? dto.bikeVariantId
          : modelChanged
            ? null
            : current.bikeVariantId;
      if (modelChanged || dto.bikeVariantId !== undefined) {
        await this.assertSelectable(tx, modelId, variantId, current);
      }
      if (dto.isPrimary === true && !current.isPrimary) await this.clearPrimary(tx, user);

      await tx.riderBike.update({
        where: { id },
        data: {
          bikeModelId: modelId,
          bikeVariantId: variantId,
          ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
          ...(dto.year !== undefined ? { year: dto.year } : {}),
          ...(dto.odometerKm !== undefined ? { odometerKm: dto.odometerKm } : {}),
          // Unsetting the only primary is refused silently: use another bike's primary action.
          ...(dto.isPrimary === true ? { isPrimary: true } : {}),
        },
      });
    });
    return this.get(user, id);
  }

  async setPrimary(user: AuthUser, id: string): Promise<RiderBikeDto> {
    return this.update(user, id, { isPrimary: true });
  }

  /** Removing the primary bike promotes the oldest remaining one. */
  async remove(user: AuthUser, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockRider(tx, user);
      const bike = await this.findOwn(tx, user, id);
      await tx.riderBike.delete({ where: { id } });
      if (!bike.isPrimary) return;
      const next = await tx.riderBike.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (next) await tx.riderBike.update({ where: { id: next.id }, data: { isPrimary: true } });
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async lockRider(tx: Prisma.TransactionClient, user: AuthUser): Promise<void> {
    if (!(await lockRow(tx, "users", user.id))) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "Authentication required.",
      );
    }
  }

  private async clearPrimary(tx: Prisma.TransactionClient, user: AuthUser): Promise<void> {
    await tx.riderBike.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  private async findOwn(
    client: Prisma.TransactionClient,
    user: AuthUser,
    id: string,
  ): Promise<RiderBikeRow> {
    const row = await client.riderBike.findFirst({
      where: { id, userId: user.id },
      include: riderBikeInclude,
    });
    if (!row) throw notFound("Motorcycle");
    return row;
  }

  /**
   * New choices must be active catalogue entries. A bike that is already in the
   * garage keeps its (possibly since-archived) model and variant.
   */
  private async assertSelectable(
    tx: Prisma.TransactionClient,
    modelId: string,
    variantId: string | null,
    current?: RiderBikeRow,
  ): Promise<void> {
    const model = await tx.bikeModel.findUnique({
      where: { id: modelId },
      select: { archivedAt: true, brand: { select: { archivedAt: true } } },
    });
    const keepsModel = current?.bikeModelId === modelId;
    if (!model || (!keepsModel && (model.archivedAt || model.brand.archivedAt))) {
      throw invalid("bikeModelId", "Choose a motorcycle from the catalogue.");
    }
    if (!variantId) return;
    const variant = await tx.bikeVariant.findUnique({
      where: { id: variantId },
      select: { modelId: true, archivedAt: true },
    });
    const keepsVariant = current?.bikeVariantId === variantId;
    if (!variant || variant.modelId !== modelId || (!keepsVariant && variant.archivedAt)) {
      throw invalid("bikeVariantId", "Choose a variant of the selected motorcycle.");
    }
  }

  private assertYear(year: number | null | undefined): void {
    if (year === undefined || year === null) return;
    const latest = new Date().getUTCFullYear() + 1;
    if (year < EARLIEST_MODEL_YEAR || year > latest) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        "Request validation failed.",
        [
          {
            field: "year",
            messages: [`year must be between ${EARLIEST_MODEL_YEAR} and ${latest}`],
          },
        ],
      );
    }
  }

  private toResponse(row: RiderBikeRow): RiderBikeDto {
    return {
      id: row.id,
      bike: this.bikes.model(row.bikeModel),
      bikeVariantId: row.bikeVariantId,
      bikeVariantName: row.bikeVariant?.name ?? null,
      nickname: row.nickname,
      year: row.year,
      odometerKm: row.odometerKm,
      isPrimary: row.isPrimary,
      archived: Boolean(row.bikeModel.archivedAt ?? row.bikeModel.brand.archivedAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

function invalid(field: string, message: string): ApiException {
  return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_REFERENCE, message, [
    { field, messages: [message] },
  ]);
}
