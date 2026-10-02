import { ApiProperty } from "@nestjs/swagger";
import { ProductStatus, StockStatus } from "../../generated/prisma/enums.js";

export class ImageDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: "Null while storage is not configured",
  })
  url!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  width!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  height!: number | null;

  @ApiProperty({ type: String, nullable: true })
  altText!: string | null;
}

export class ProductImageDto extends ImageDto {
  @ApiProperty({ format: "uuid" })
  mediaAssetId!: string;

  @ApiProperty({ type: String, nullable: true })
  caption!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isPrimary!: boolean;
}

export class CatalogRefDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class ProductFitRefDto {
  @ApiProperty({ format: "uuid" })
  bikeModelId!: string;

  @ApiProperty({ type: String, format: "uuid", nullable: true, description: "Null: every variant" })
  bikeVariantId!: string | null;
}

export class ProductSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  shortDescription!: string | null;

  @ApiProperty({ type: CatalogRefDto, nullable: true })
  brand!: CatalogRefDto | null;

  @ApiProperty({ type: CatalogRefDto })
  category!: CatalogRefDto;

  @ApiProperty({ description: "Minor units (paise)", example: 849900 })
  price!: number;

  @ApiProperty({ type: Number, nullable: true, description: "Minor units (paise)" })
  compareAtPrice!: number | null;

  @ApiProperty({ example: "INR" })
  currency!: string;

  @ApiProperty({ enum: StockStatus, enumName: "StockStatus" })
  stockStatus!: StockStatus;

  @ApiProperty()
  stockQuantity!: number;

  @ApiProperty({
    description: "Most units that can go in a cart right now; 0 when not purchasable",
  })
  maxOrderQuantity!: number;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({ description: "Fits any motorcycle" })
  universalFit!: boolean;

  @ApiProperty({ type: [ProductFitRefDto] })
  fits!: ProductFitRefDto[];

  @ApiProperty({ type: ProductImageDto, nullable: true })
  primaryImage!: ProductImageDto | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;
}

export class ProductSpecificationDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: String, nullable: true })
  groupName!: string | null;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  sortOrder!: number;
}

export class CompatibleBikeDto {
  @ApiProperty({ format: "uuid" })
  bikeModelId!: string;

  @ApiProperty()
  bikeModelSlug!: string;

  @ApiProperty({ example: "Himalayan 450" })
  bikeModelName!: string;

  @ApiProperty({ example: "Royal Enfield" })
  brandName!: string;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  bikeVariantId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  bikeVariantName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  note!: string | null;

  @ApiProperty({ description: "The bike (or variant) has been archived from the catalogue" })
  archived!: boolean;
}

export class ProductDetailDto extends ProductSummaryDto {
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  weightGrams!: number | null;

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];

  @ApiProperty({ type: [ProductSpecificationDto] })
  specifications!: ProductSpecificationDto[];

  @ApiProperty({ type: [CompatibleBikeDto] })
  compatibility!: CompatibleBikeDto[];
}

export class AdminProductDto extends ProductDetailDto {
  @ApiProperty({ enum: ProductStatus, enumName: "ProductStatus" })
  status!: ProductStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  createdById!: string | null;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  updatedById!: string | null;
}

export class AdminProductListItemDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ProductStatus, enumName: "ProductStatus" })
  status!: ProductStatus;

  @ApiProperty({ type: CatalogRefDto })
  category!: CatalogRefDto;

  @ApiProperty({ type: CatalogRefDto, nullable: true })
  brand!: CatalogRefDto | null;

  @ApiProperty({ description: "Minor units" })
  price!: number;

  @ApiProperty({ type: Number, nullable: true })
  compareAtPrice!: number | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  stockQuantity!: number;

  @ApiProperty({ enum: StockStatus, enumName: "StockStatus" })
  stockStatus!: StockStatus;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({ type: ProductImageDto, nullable: true })
  primaryImage!: ProductImageDto | null;

  @ApiProperty()
  imageCount!: number;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class CategoryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: ImageDto, nullable: true })
  image!: ImageDto | null;

  @ApiProperty({
    description: "Published products (public); products in any status (admin)",
  })
  productCount!: number;
}

export class BrandDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  productCount!: number;
}

export class ProductImageListDto {
  @ApiProperty({ format: "uuid" })
  productId!: string;

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];
}
