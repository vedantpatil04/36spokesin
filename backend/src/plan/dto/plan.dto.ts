import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trim } from "../../common/validation/transforms.js";
import { MAX_TRIP_DAYS, RIDING_STYLES, type RidingStyle } from "../plan.types.js";

// ─── Inputs ────────────────────────────────────────────────────────────────

/** A journey to plan. Four fields are enough; the rest refine the plan. */
export class PlanJourneyDto {
  @ApiProperty({ example: "Belagavi", maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  origin!: string;

  @ApiProperty({ example: "Goa", maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  destination!: string;

  @ApiProperty({ example: "2026-10-12", description: "Day the ride starts" })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be a date like 2026-10-12" })
  date!: string;

  @ApiProperty({ minimum: 1, maximum: 50, example: 2 })
  @IsInt()
  @Min(1)
  @Max(50)
  riders!: number;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    description: "A bike from GET /bikes. Its catalogue mileage and tank size are used.",
  })
  @IsOptional()
  @IsUUID()
  bikeModelId?: string;

  @ApiPropertyOptional({
    description: "Your own mileage in km per litre; overrides the catalogue's",
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(5)
  @Max(120)
  mileageKmpl?: number;

  @ApiPropertyOptional({ description: "Fuel price in INR per litre" })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(500)
  fuelPricePerLitre?: number;

  @ApiPropertyOptional({ enum: RIDING_STYLES, default: "balanced" })
  @IsOptional()
  @IsIn(RIDING_STYLES)
  ridingStyle?: RidingStyle;

  @ApiPropertyOptional({ minimum: 50, maximum: 800, description: "Distance to aim for per day" })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(800)
  dailyDistanceKm?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_TRIP_DAYS })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_TRIP_DAYS)
  tripDays?: number;

  @ApiPropertyOptional({ description: "Budget in INR, passed to the planner as context" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  budget?: number;
}

export class SaveJourneyDto {
  @ApiProperty({ type: Object, description: "The plan exactly as POST /journeys/plan returned it" })
  @IsObject()
  plan!: Record<string, unknown>;

  @ApiProperty({ description: "The token returned with that plan" })
  @IsString()
  @MaxLength(200)
  token!: string;
}

// ─── Responses ─────────────────────────────────────────────────────────────

export class PlannedJourneyDto {
  @ApiProperty({
    type: Object,
    description:
      "The structured plan. Facts carry their data source in `sources`; only the AI-written " +
      "parts (overview, choice of stops, notes) come from the model named in `sources.itinerary`.",
  })
  plan!: object;

  @ApiProperty({ description: "Proves the plan came from this API; send it back to save the plan" })
  token!: string;
}

export class SavedJourneySummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Belagavi to Goa" })
  title!: string;

  @ApiProperty()
  originName!: string;

  @ApiProperty()
  destinationName!: string;

  @ApiProperty({ example: "2026-10-12" })
  travelDate!: string;

  @ApiProperty()
  riders!: number;

  @ApiProperty()
  distanceKm!: number;

  @ApiProperty()
  rideMinutes!: number;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}

export class SavedJourneyDto extends SavedJourneySummaryDto {
  @ApiProperty({ type: Object, description: "The plan as it was saved; never regenerated" })
  plan!: object;
}
