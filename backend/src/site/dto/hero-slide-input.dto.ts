import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import { ContentStatus, HeroAutoAdvanceMode, HeroMediaType } from "../../generated/prisma/enums.js";

export class CreateHeroSlideDto {
  @ApiProperty({ example: "The road starts where the map runs out" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: "Official 36 Spokes Rider Network" })
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @ApiPropertyOptional({
    example:
      "Expeditions across the Himalaya, gear matched to the motorcycle in your garage, and riders who turn up when you post a route.",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Ladakh & Spiti Valley" })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: HeroMediaType, default: HeroMediaType.IMAGE })
  @IsOptional()
  @IsEnum(HeroMediaType)
  mediaType?: HeroMediaType;

  @ApiPropertyOptional({ example: "https://res.cloudinary.com/demo/image/upload/sample.jpg" })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: "https://res.cloudinary.com/demo/video/upload/sample.mp4" })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: "https://res.cloudinary.com/demo/image/upload/poster.jpg" })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional({ example: "https://res.cloudinary.com/demo/video/upload/mobile.mp4" })
  @IsOptional()
  @IsString()
  mobileUrl?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID(7)
  imageMediaId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID(7)
  videoMediaId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID(7)
  posterMediaId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID(7)
  mobileMediaId?: string;

  @ApiPropertyOptional({ example: "Choose your path" })
  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @ApiPropertyOptional({ example: "/rides" })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional({ example: "Plan a journey" })
  @IsOptional()
  @IsString()
  secondaryCtaLabel?: string;

  @ApiPropertyOptional({ example: "/plan" })
  @IsOptional()
  @IsString()
  secondaryCtaUrl?: string;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({
    enum: HeroAutoAdvanceMode,
    default: HeroAutoAdvanceMode.FIXED_DURATION,
  })
  @IsOptional()
  @IsEnum(HeroAutoAdvanceMode)
  autoAdvanceMode?: HeroAutoAdvanceMode;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus, default: ContentStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class UpdateHeroSlideDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  eyebrow?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: HeroMediaType })
  @IsOptional()
  @IsEnum(HeroMediaType)
  mediaType?: HeroMediaType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileUrl?: string;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID(7)
  imageMediaId?: string | null;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID(7)
  videoMediaId?: string | null;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID(7)
  posterMediaId?: string | null;

  @ApiPropertyOptional({ format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID(7)
  mobileMediaId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryCtaLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondaryCtaUrl?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({ enum: HeroAutoAdvanceMode })
  @IsOptional()
  @IsEnum(HeroAutoAdvanceMode)
  autoAdvanceMode?: HeroAutoAdvanceMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ enum: ContentStatus })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class ReorderHeroSlidesDto {
  @ApiProperty({ type: [String], format: "uuid" })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(7, { each: true })
  ids!: string[];
}
