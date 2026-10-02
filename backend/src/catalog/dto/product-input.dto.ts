import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
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
import {
  SKU_PATTERN,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  normaliseSku,
  normaliseSlug,
} from "../../common/validation/slug.js";
import { trim, trimToNull } from "../../common/validation/transforms.js";
import { ProductStatus, StockStatus } from "../../generated/prisma/enums.js";

/** ₹10 crore in paise: far above any real accessory, low enough to stay a 32-bit integer. */
export const MAX_PRICE_MINOR = 1_000_000_000;
export const SUPPORTED_CURRENCIES = ["INR"] as const;

export class ProductSpecificationInputDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 60, example: "Dimensions" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  groupName?: string | null;

  @ApiProperty({ maxLength: 80, example: "Capacity" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @ApiProperty({ maxLength: 300, example: "38 L per side" })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  value!: string;
}

export class ProductCompatibilityInputDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  bikeModelId!: string;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "Omit for every variant",
  })
  @IsOptional()
  @IsUUID()
  bikeVariantId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 200 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string | null;
}

export class CreateProductDto {
  @ApiProperty({ maxLength: 160, example: "Adventure Riding Jacket" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional({
    description: "Generated from the name when omitted",
    maxLength: SLUG_MAX_LENGTH,
  })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiProperty({ example: "36S-JKT-ADV-01", description: "Stored upper-case" })
  @Transform(normaliseSku)
  @IsString()
  @Matches(SKU_PATTERN, {
    message: "sku must be 2–64 characters: letters, digits, dots, hyphens or underscores",
  })
  sku!: string;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  brandId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 10000 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string | null;

  @ApiProperty({ description: "Minor units (paise). ₹8,499 is 849900.", example: 849900 })
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE_MINOR)
  price!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: "Minor units; must exceed price",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_PRICE_MINOR)
  compareAtPrice?: number | null;

  @ApiPropertyOptional({ enum: SUPPORTED_CURRENCIES, default: "INR" })
  @IsOptional()
  @IsIn(SUPPORTED_CURRENCIES)
  currency?: (typeof SUPPORTED_CURRENCIES)[number];

  @ApiPropertyOptional({ enum: ProductStatus, enumName: "ProductStatus", default: "DRAFT" })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stockQuantity?: number;

  @ApiPropertyOptional({ enum: StockStatus, enumName: "StockStatus", default: "IN_STOCK" })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  weightGrams?: number | null;

  @ApiPropertyOptional({ description: "Fits any motorcycle" })
  @IsOptional()
  @IsBoolean()
  universalFit?: boolean;

  @ApiPropertyOptional({ type: [ProductSpecificationInputDto], description: "Replaces all rows" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductSpecificationInputDto)
  specifications?: ProductSpecificationInputDto[];

  @ApiPropertyOptional({ type: [ProductCompatibilityInputDto], description: "Replaces all rows" })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ProductCompatibilityInputDto)
  compatibility?: ProductCompatibilityInputDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class AttachProductImageDto {
  @ApiProperty({ format: "uuid", description: "A READY media asset of category PRODUCT" })
  @IsUUID()
  mediaAssetId!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string | null;

  @ApiPropertyOptional({ description: "Make this the primary image. The first image always is." })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateProductImageDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string | null;
}

export class ReorderProductImagesDto {
  @ApiProperty({
    type: [String],
    format: "uuid",
    description: "Every image id of the product, in the new order",
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID("all", { each: true })
  imageIds!: string[];
}

export class ReplaceProductImageDto {
  @ApiProperty({ format: "uuid", description: "The new READY PRODUCT asset" })
  @IsUUID()
  mediaAssetId!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 300,
    description: "Alt text for the new image. Omit to use the asset's own.",
  })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string | null;
}
