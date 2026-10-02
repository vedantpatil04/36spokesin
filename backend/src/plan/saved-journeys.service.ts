import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { SaveJourneyDto, SavedJourneyDto, SavedJourneySummaryDto } from "./dto/plan.dto.js";
import type { JourneyPlan } from "./itinerary/journey-plan.js";
import { PlanSigner } from "./support/plan-signature.js";

export const MAX_SAVED_JOURNEYS = 50;

const summarySelect = {
  id: true,
  title: true,
  originName: true,
  destinationName: true,
  travelDate: true,
  riders: true,
  distanceKm: true,
  rideMinutes: true,
  createdAt: true,
} satisfies Prisma.SavedJourneySelect;

type SummaryRow = Prisma.SavedJourneyGetPayload<{ select: typeof summarySelect }>;

/**
 * Journeys a rider chose to keep. A plan is stored as it was generated (the
 * structured plan, not provider responses) and is read back as stored: opening
 * a saved journey never calls a data source or the AI again.
 */
@Injectable()
export class SavedJourneysService {
  private readonly logger = new Logger(SavedJourneysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly signer: PlanSigner,
  ) {}

  async list(user: AuthUser): Promise<SavedJourneySummaryDto[]> {
    const rows = await this.prisma.savedJourney.findMany({
      where: { userId: user.id },
      select: summarySelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return rows.map(summary);
  }

  /** Only the rider who saved it can read a journey. */
  async get(user: AuthUser, id: string): Promise<SavedJourneyDto> {
    const row = await this.prisma.savedJourney.findFirst({
      where: { id, userId: user.id },
      select: { ...summarySelect, plan: true },
    });
    if (!row) throw notFound("Journey");
    return { ...summary(row), plan: row.plan as object };
  }

  /**
   * Saves a plan this API generated. The token proves the plan is unchanged, so
   * a rider can't store arbitrary data as a "journey". Saving the same plan
   * twice returns the journey already saved.
   */
  async save(user: AuthUser, dto: SaveJourneyDto): Promise<SavedJourneySummaryDto> {
    if (!this.signer.verify(dto.plan, dto.token)) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PLAN_NOT_VERIFIED,
        "This plan can't be saved. Plan the journey again and save the new plan.",
      );
    }
    const plan = dto.plan as unknown as JourneyPlan;

    const existing = await this.prisma.savedJourney.findUnique({
      where: { userId_signature: { userId: user.id, signature: dto.token } },
      select: summarySelect,
    });
    if (existing) return summary(existing);

    if (
      (await this.prisma.savedJourney.count({ where: { userId: user.id } })) >= MAX_SAVED_JOURNEYS
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.LIMIT_REACHED,
        `You can keep up to ${MAX_SAVED_JOURNEYS} journeys. Delete one to save another.`,
      );
    }
    const row = await this.prisma.savedJourney.create({
      data: {
        userId: user.id,
        signature: dto.token,
        title: `${plan.origin.name} to ${plan.destination.name}`,
        originName: plan.origin.name,
        destinationName: plan.destination.name,
        travelDate: new Date(`${plan.travelDate}T00:00:00Z`),
        riders: plan.riders,
        distanceKm: plan.distanceKm,
        rideMinutes: plan.estimatedRideMinutes,
        plan: plan as unknown as Prisma.InputJsonValue,
      },
      select: summarySelect,
    });
    this.logger.log({ userId: user.id, journeyId: row.id }, "Journey saved");
    return summary(row);
  }

  async remove(user: AuthUser, id: string): Promise<void> {
    const { count } = await this.prisma.savedJourney.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) throw notFound("Journey");
  }
}

function summary(row: SummaryRow): SavedJourneySummaryDto {
  return { ...row, travelDate: row.travelDate.toISOString().slice(0, 10) };
}
