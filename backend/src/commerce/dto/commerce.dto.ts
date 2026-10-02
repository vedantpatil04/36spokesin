import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";
import { ProductSummaryDto } from "../../catalog/dto/catalog-response.dto.js";
import { MAX_LINE_QUANTITY } from "../../catalog/product-rules.js";
import { OrderStatus } from "../../generated/prisma/enums.js";

// ─── Cart ──────────────────────────────────────────────────────────────────

export class AddCartItemDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_LINE_QUANTITY,
    default: 1,
    description: "Added to any quantity already in the cart",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_LINE_QUANTITY)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1, maximum: MAX_LINE_QUANTITY })
  @IsInt()
  @Min(1)
  @Max(MAX_LINE_QUANTITY)
  quantity!: number;
}

export const CART_LINE_ISSUES = ["NOT_AVAILABLE", "OUT_OF_STOCK", "INSUFFICIENT_STOCK"] as const;

export class CartLineDto {
  @ApiProperty({ format: "uuid", description: "Cart item id" })
  id!: string;

  @ApiProperty({ type: ProductSummaryDto })
  product!: ProductSummaryDto;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: "Current unit price, minor units" })
  unitPrice!: number;

  @ApiProperty({ description: "unitPrice × quantity, minor units" })
  lineTotal!: number;

  @ApiProperty({
    enum: CART_LINE_ISSUES,
    nullable: true,
    description: "Why the line can't be bought as it stands",
  })
  issue!: (typeof CART_LINE_ISSUES)[number] | null;
}

export class CartDto {
  @ApiProperty({ type: [CartLineDto] })
  items!: CartLineDto[];

  @ApiProperty({ description: "Total units across all lines" })
  itemCount!: number;

  @ApiProperty({ description: "Sum of lines without an issue, minor units" })
  subtotal!: number;

  @ApiProperty({ example: "INR" })
  currency!: string;

  @ApiProperty({ description: "False while any line has an issue or the cart is empty" })
  readyForCheckout!: boolean;
}

// ─── Wishlist ──────────────────────────────────────────────────────────────

export class AddWishlistItemDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  productId!: string;
}

export class WishlistItemDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: ProductSummaryDto })
  product!: ProductSummaryDto;

  @ApiProperty({ description: "Still published in the shop" })
  available!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  addedAt!: Date;
}

// ─── Orders ────────────────────────────────────────────────────────────────

export class OrderItemDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  productId!: string | null;

  @ApiProperty()
  productName!: string;

  @ApiProperty()
  sku!: string;

  @ApiProperty({ description: "Unit price at the time of the order, minor units" })
  unitPrice!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty({ description: "Minor units" })
  total!: number;
}

export class OrderDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: 10428 })
  number!: number;

  @ApiProperty({ enum: OrderStatus, enumName: "OrderStatus" })
  status!: OrderStatus;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ description: "Minor units" })
  subtotal!: number;

  @ApiProperty({ description: "Minor units" })
  total!: number;

  @ApiProperty({ type: [OrderItemDto] })
  items!: OrderItemDto[];

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  placedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}
