import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MAX_PRICE_MINOR } from "../../catalog/dto/product-input.dto.js";
import { queryBoolean } from "../../common/validation/query.js";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, normaliseSlug } from "../../common/validation/slug.js";
import { trim, trimToNull } from "../../common/validation/transforms.js";
import { ContentStatus, DepartureStatus, Difficulty } from "../../generated/prisma/enums.js";

const text = (max: number) => [Transform(trimToNull), IsOptional(), IsString(), MaxLength(max)];
const apply =
  (decorators: PropertyDecorator[]): PropertyDecorator =>
  (target, key) =>
    decorators.forEach((decorator) => decorator(target, key));

class SluggedContentDto {
  @ApiPropertyOptional({ description: "Generated from the name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @apply(text(300))
  shortDescription?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 20000 })
  @apply(text(20000))
  description?: string | null;

  @ApiProperty({ enum: Difficulty, enumName: "Difficulty" })
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiPropertyOptional({ enum: ContentStatus, enumName: "ContentStatus", default: "DRAFT" })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class CreateDestinationDto extends SluggedContentDto {
  @ApiProperty({ maxLength: 120, example: "Spiti Valley" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ maxLength: 120, example: "Himachal Pradesh" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  region!: string;

  @ApiPropertyOptional({ maxLength: 80, default: "India" })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 120,
    example: "June to September",
  })
  @apply(text(120))
  bestSeason?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120, example: "8–12 days" })
  @apply(text(120))
  durationRecommendation?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 10000 })
  @apply(text(10000))
  usefulInfo?: string | null;
}

export class UpdateDestinationDto extends PartialType(CreateDestinationDto) {}

export class ItineraryDayInputDto {
  @ApiProperty({ maxLength: 160, example: "Manali to Kaza via Kunzum La" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  @apply(text(5000))
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @apply(text(300))
  routeSummary?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2000)
  distanceKm?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @apply(text(200))
  accommodation?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @apply(text(2000))
  notes?: string | null;
}

export class DepartureInputDto {
  @ApiPropertyOptional({
    format: "uuid",
    description: "Existing departure to keep; omit for a new one",
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: "2026-10-05" })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "startDate must be YYYY-MM-DD" })
  startDate!: string;

  @ApiProperty({ example: "2026-10-12" })
  @IsISO8601({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "endDate must be YYYY-MM-DD" })
  endDate!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, description: "Paise per rider" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE_MINOR)
  price?: number | null;

  @ApiProperty({ minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  capacity!: number;

  @ApiPropertyOptional({ enum: DepartureStatus, enumName: "DepartureStatus", default: "OPEN" })
  @IsOptional()
  @IsEnum(DepartureStatus)
  status?: DepartureStatus;
}

export class CreateTripDto extends SluggedContentDto {
  @ApiProperty({ maxLength: 160, example: "Spiti Circuit" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  destinationId!: string;

  @ApiProperty({ minimum: 1, maximum: 90 })
  @IsInt()
  @Min(1)
  @Max(90)
  durationDays!: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  distanceKm?: number | null;

  @ApiProperty({ maxLength: 120, example: "Manali" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  startingLocation!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @apply(text(120))
  endingLocation?: string | null;

  @ApiPropertyOptional({
    type: [ItineraryDayInputDto],
    description: "Replaces all days; numbered in order",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(90)
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayInputDto)
  itinerary?: ItineraryDayInputDto[];

  @ApiPropertyOptional({
    type: [DepartureInputDto],
    description: "Full list: rows with an id are updated, new rows created, missing rows removed",
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => DepartureInputDto)
  departures?: DepartureInputDto[];
}

export class UpdateTripDto extends PartialType(CreateTripDto) {}

export class TravelListQueryDto {
  @ApiPropertyOptional({ description: "Destination slug" })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(queryBoolean)
  @IsBoolean()
  featured?: boolean;
}

export class AdminTravelListQueryDto {
  @ApiPropertyOptional({ enum: ContentStatus, enumName: "ContentStatus" })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  q?: string | null;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  destinationId?: string;
}
