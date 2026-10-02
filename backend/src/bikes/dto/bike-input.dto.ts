import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, normaliseSlug } from "../../common/validation/slug.js";
import { trim, trimToNull } from "../../common/validation/transforms.js";
import { BikeSegment } from "../../generated/prisma/enums.js";

export class CreateBikeBrandDto {
  @ApiProperty({ maxLength: 60, example: "Royal Enfield" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ description: "Generated from the name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;
}

export class UpdateBikeBrandDto extends PartialType(CreateBikeBrandDto) {
  @ApiPropertyOptional({ description: "Archive (true) or restore (false)" })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateBikeModelDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  brandId!: string;

  @ApiProperty({ maxLength: 80, example: "Himalayan 450" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ description: "Generated from brand and model name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiProperty({ enum: BikeSegment, enumName: "BikeSegment" })
  @IsEnum(BikeSegment)
  segment!: BikeSegment;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 2000 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 50, maximum: 3000 })
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(3000)
  displacementCc?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 1, maximum: 150 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(150)
  fuelEfficiencyKmpl?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 1, maximum: 60 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(1)
  @Max(60)
  tankLitres?: number | null;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "A READY BIKE asset; null removes the image",
  })
  @IsOptional()
  @IsUUID()
  imageMediaId?: string | null;

  @ApiPropertyOptional({
    type: [String],
    description: "Initial variant names",
    example: ["Kaza Brown"],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(60, { each: true })
  variants?: string[];
}

export class UpdateBikeModelDto extends PartialType(
  OmitType(CreateBikeModelDto, ["variants"] as const),
) {
  @ApiPropertyOptional({ description: "Archive (true) or restore (false)" })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateBikeVariantDto {
  @ApiProperty({ maxLength: 60, example: "Slate Himalayan Salt" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  sortOrder?: number;
}

export class UpdateBikeVariantDto extends PartialType(CreateBikeVariantDto) {
  @ApiPropertyOptional({ description: "Archive (true) or restore (false)" })
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
