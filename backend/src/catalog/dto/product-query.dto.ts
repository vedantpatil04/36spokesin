import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
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
} from "class-validator";
import { CursorPaginationQueryDto } from "../../common/pagination/cursor-pagination.dto.js";
import { queryBoolean } from "../../common/validation/query.js";
import { SLUG_PATTERN } from "../../common/validation/slug.js";
import { trimToNull } from "../../common/validation/transforms.js";
import { ProductStatus } from "../../generated/prisma/enums.js";

export const PRODUCT_SORTS = ["newest", "price_asc", "price_desc", "name_asc"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export class ProductListQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ description: "Category slug", example: "protect" })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  category?: string;

  @ApiPropertyOptional({ description: "Brand slug" })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  brand?: string;

  @ApiPropertyOptional({
    format: "uuid",
    description: "Bike model id: only products confirmed to fit it (universal gear excluded)",
  })
  @IsOptional()
  @IsUUID()
  bike?: string;

  @ApiPropertyOptional({ format: "uuid", description: "Narrows `bike` to one variant" })
  @IsOptional()
  @IsUUID()
  variant?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(queryBoolean)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ maxLength: 100, description: "Matches name or SKU" })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  q?: string | null;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS, default: "newest" })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;
}

export class RelatedProductsQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, default: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  limit: number = 4;
}

export const ADMIN_PRODUCT_SORTS = [
  "updated_desc",
  "created_desc",
  "name_asc",
  "price_asc",
  "price_desc",
  "stock_asc",
] as const;
export type AdminProductSort = (typeof ADMIN_PRODUCT_SORTS)[number];

export class AdminProductListQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({ maxLength: 100, description: "Matches name, SKU or slug" })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  q?: string | null;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ enum: ProductStatus, enumName: "ProductStatus" })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ADMIN_PRODUCT_SORTS, default: "updated_desc" })
  @IsOptional()
  @IsIn(ADMIN_PRODUCT_SORTS)
  sort?: AdminProductSort;
}
