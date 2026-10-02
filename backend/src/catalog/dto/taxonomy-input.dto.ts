import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsInt,
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

export class CreateCategoryDto {
  @ApiProperty({ maxLength: 60, example: "Protect" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ description: "Generated from the name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 200,
    example: "Helmets, armour, guards",
  })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 10000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "A READY PRODUCT or SITE asset; null removes the image",
  })
  @IsOptional()
  @IsUUID()
  imageMediaId?: string | null;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateBrandDto {
  @ApiProperty({ maxLength: 80, example: "36 Spokes Workshop" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ description: "Generated from the name when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;
}

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
