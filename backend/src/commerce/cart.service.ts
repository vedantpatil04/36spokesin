import { HttpStatus, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { CatalogMapper, productSummaryInclude } from "../catalog/catalog.mapper.js";
import {
  MAX_LINE_QUANTITY,
  maxOrderQuantity,
  unavailableReason,
} from "../catalog/product-rules.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ProductStatus } from "../generated/prisma/enums.js";
import type { AddCartItemDto, CartDto, UpdateCartItemDto } from "./dto/commerce.dto.js";

export const MAX_CART_LINES = 50;

const cartItemInclude = {
  product: { include: productSummaryInclude },
} satisfies Prisma.CartItemInclude;

/**
 * Server-side cart, one per rider. Quantities are stored; prices and
 * availability are read live from the catalogue on every view, so a price or
 * stock change is reflected immediately. Payment is not part of Phase 4.
 */
@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CatalogMapper,
  ) {}

  async view(user: AuthUser): Promise<CartDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { include: cartItemInclude, orderBy: { createdAt: "asc" } } },
    });
    const items = (cart?.items ?? []).map((item) => {
      const issue = unavailableReason(item.product, item.quantity);
      return {
        id: item.id,
        product: this.mapper.summary(item.product),
        quantity: item.quantity,
        unitPrice: item.product.price,
        lineTotal: item.product.price * item.quantity,
        issue,
      };
    });
    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.filter((item) => !item.issue).reduce((sum, item) => sum + item.lineTotal, 0),
      currency: "INR",
      readyForCheckout: items.length > 0 && items.every((item) => !item.issue),
    };
  }

  async addItem(user: AuthUser, dto: AddCartItemDto): Promise<CartDto> {
    const quantity = dto.quantity ?? 1;
    await this.prisma.$transaction(async (tx) => {
      const product = await this.loadPurchasable(tx, dto.productId);
      const cart = await tx.cart.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
        select: { id: true },
      });
      const existing = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      });
      const next = (existing?.quantity ?? 0) + quantity;
      assertQuantity(product, next);
      if (existing) {
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: next } });
        return;
      }
      if ((await tx.cartItem.count({ where: { cartId: cart.id } })) >= MAX_CART_LINES) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.LIMIT_REACHED,
          `A cart can hold up to ${MAX_CART_LINES} different products.`,
        );
      }
      await tx.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: next },
      });
    });
    return this.view(user);
  }

  async updateItem(user: AuthUser, itemId: string, dto: UpdateCartItemDto): Promise<CartDto> {
    const item = await this.findOwnItem(user, itemId);
    const product = await this.loadPurchasable(this.prisma, item.productId);
    assertQuantity(product, dto.quantity);
    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: dto.quantity } });
    return this.view(user);
  }

  async removeItem(user: AuthUser, itemId: string): Promise<CartDto> {
    const item = await this.findOwnItem(user, itemId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.view(user);
  }

  async clear(user: AuthUser): Promise<CartDto> {
    await this.prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
    return this.view(user);
  }

  private async findOwnItem(user: AuthUser, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.id } },
      select: { id: true, productId: true },
    });
    if (!item) throw notFound("Cart item");
    return item;
  }

  private async loadPurchasable(client: Prisma.TransactionClient, productId: string) {
    const product = await client.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, stockStatus: true, stockQuantity: true },
    });
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PRODUCT_UNAVAILABLE,
        "This product isn't available in the shop.",
      );
    }
    if (maxOrderQuantity(product) === 0) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PRODUCT_UNAVAILABLE,
        "This product is out of stock.",
      );
    }
    return product;
  }
}

function assertQuantity(product: Parameters<typeof maxOrderQuantity>[0], quantity: number): void {
  const max = maxOrderQuantity(product);
  if (quantity <= max) return;
  const message =
    max < MAX_LINE_QUANTITY
      ? `Only ${max} can be ordered right now.`
      : `You can order up to ${MAX_LINE_QUANTITY} of one product.`;
  throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorCode.INVALID_QUANTITY, message, [
    { field: "quantity", messages: [message] },
  ]);
}
