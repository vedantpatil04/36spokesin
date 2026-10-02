import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { queryBoolean } from "../../common/validation/query.js";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, normaliseSlug } from "../../common/validation/slug.js";
import { trim, trimToNull } from "../../common/validation/transforms.js";
import { ContentStatus } from "../../generated/prisma/enums.js";

/** Optional free text: trimmed, "" clears it (null), capped at `max` characters. */
const text = (max: number) => [Transform(trimToNull), IsOptional(), IsString(), MaxLength(max)];
/** Optional http(s) link; "" clears it. */
const link = () => [
  Transform(trimToNull),
  IsOptional(),
  IsUrl(
    { require_protocol: true, protocols: ["http", "https"] },
    { message: "must be a full link starting with https://" },
  ),
  MaxLength(500),
];
const apply =
  (decorators: PropertyDecorator[]): PropertyDecorator =>
  (target, key) =>
    decorators.forEach((decorator) => decorator(target, key));

const imageDoc = (categories: string) => ({
  type: String,
  format: "uuid",
  nullable: true,
  description: `A READY ${categories} asset; null removes the image`,
});

class EditorialDto {
  @ApiPropertyOptional({ enum: ContentStatus, enumName: "ContentStatus", default: "DRAFT" })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000, description: "Appended last when omitted" })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

// ─── Founders ────────────────────────────────────────────────────────────────

export class CreateFounderDto extends EditorialDto {
  @ApiProperty({ maxLength: 120, example: "Abhishek Sharma" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @apply(text(120))
  role?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 600 })
  @apply(text(600))
  shortBio?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 20000 })
  @apply(text(20000))
  story?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 400 })
  @apply(text(400))
  quote?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "https://www.instagram.com/…" })
  @apply(link())
  instagramUrl?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "https://www.linkedin.com/in/…" })
  @apply(link())
  linkedinUrl?: string | null;

  @ApiPropertyOptional(imageDoc("COMMUNITY or SITE"))
  @IsOptional()
  @IsUUID()
  imageMediaId?: string | null;
}

export class UpdateFounderDto extends PartialType(CreateFounderDto) {}

// ─── Stories ─────────────────────────────────────────────────────────────────

export class CreateStoryDto extends EditorialDto {
  @ApiProperty({ maxLength: 160, example: "Spiti in shoulder season" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: "Generated from the title when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 400 })
  @apply(text(400))
  excerpt?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 50000 })
  @apply(text(50000))
  content?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120, description: "Credit line" })
  @apply(text(120))
  authorName?: string | null;

  @ApiPropertyOptional(imageDoc("STORY or SITE"))
  @IsOptional()
  @IsUUID()
  coverMediaId?: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  destinationId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}

export class UpdateStoryDto extends PartialType(CreateStoryDto) {}

// ─── Rider spotlights ────────────────────────────────────────────────────────

export class CreateRiderSpotlightDto extends EditorialDto {
  @ApiProperty({ maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @apply(text(120))
  bike?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @apply(text(120))
  location?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 160 })
  @apply(text(160))
  favouriteRide?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1200 })
  @apply(text(1200))
  shortStory?: string | null;

  @ApiPropertyOptional(imageDoc("COMMUNITY or SITE"))
  @IsOptional()
  @IsUUID()
  imageMediaId?: string | null;
}

export class UpdateRiderSpotlightDto extends PartialType(CreateRiderSpotlightDto) {}

// ─── Groups ──────────────────────────────────────────────────────────────────

export class CreateGroupDto extends EditorialDto {
  @ApiProperty({ maxLength: 120, example: "36 Spokes Pune" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ description: "Generated from the name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 5000 })
  @apply(text(5000))
  description?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @apply(text(120))
  region?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 80, example: "Sunday mornings" })
  @apply(text(80))
  rideCadence?: string | null;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    description: "Only when actually known; null hides it",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  memberCount?: number | null;

  @ApiPropertyOptional(imageDoc("GROUP or SITE"))
  @IsOptional()
  @IsUUID()
  coverMediaId?: string | null;
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

// ─── Shared ──────────────────────────────────────────────────────────────────

export class ReorderDto {
  @ApiProperty({
    type: [String],
    format: "uuid",
    description:
      "Ids in the new display order. Records not listed keep their relative order after these.",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  ids!: string[];
}

export class AdminCommunityQueryDto {
  @ApiPropertyOptional({ enum: ContentStatus, enumName: "ContentStatus" })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class StoryListQueryDto {
  @ApiPropertyOptional({ description: "Only featured (true) or non-featured (false) stories" })
  @Transform(queryBoolean)
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 100 })
  @Transform(({ value }) => (typeof value === "string" && value !== "" ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
