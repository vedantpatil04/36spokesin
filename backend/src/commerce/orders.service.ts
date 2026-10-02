import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { unavailableReason } from "../catalog/product-rules.js";
import { lockRow } from "../common/database/row-lock.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { CursorPage } from "../common/http/cursor-page.js";
import { notFound } from "../common/http/not-found.js";
import type { CursorPaginationQueryDto } from "../common/pagination/cursor-pagination.dto.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { OrderStatus } from "../generated/prisma/enums.js";
import type { OrderDto } from "./dto/commerce.dto.js";

const orderInclude = { items: { orderBy: { createdAt: "asc" } } } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/**
 * Order foundation. Riders can read their orders. Creating one from the cart is
 * implemented and tested but deliberately not exposed over HTTP: without a
 * payment gateway it would only produce unpaid orders. The payment phase adds
 * `POST /orders` on top of `createFromCart`.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, query: CursorPaginationQueryDto): Promise<CursorPage<OrderDto>> {
    const rows = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: orderInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    return CursorPage.fromRows(rows, query.limit, toResponse);
  }

  async get(user: AuthUser, id: string): Promise<OrderDto> {
    const row = await this.prisma.order.findFirst({
      where: { id, userId: user.id },
      include: orderInclude,
    });
    if (!row) throw notFound("Order");
    return toResponse(row);
  }

  /**
   * Snapshots the cart into a PENDING_PAYMENT order and empties the cart, in one
   * transaction. Every line must be purchasable at its quantity. Stock is not
   * reserved here: reservation belongs with payment confirmation.
   */
  async createFromCart(user: AuthUser): Promise<OrderDto> {
    const id = await this.prisma.$transaction(async (tx) => {
      await lockRow(tx, "users", user.id);
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
      });
      const lines = cart?.items ?? [];
      if (lines.length === 0) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.UNPROCESSABLE_ENTITY,
          "Your cart is empty.",
        );
      }
      const blocked = lines.find((line) => unavailableReason(line.product, line.quantity) !== null);
      if (blocked) {
        throw new ApiException(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ErrorCode.PRODUCT_UNAVAILABLE,
          `${blocked.product.name} can't be ordered at this quantity. Update your cart and try again.`,
        );
      }

      const items = lines.map((line) => ({
        productId: line.productId,
        productNameSnapshot: line.product.name,
        skuSnapshot: line.product.sku,
        priceSnapshot: line.product.price,
        quantity: line.quantity,
        total: line.product.price * line.quantity,
      }));
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const order = await tx.order.create({
        data: {
          userId: user.id,
          status: OrderStatus.PENDING_PAYMENT,
          currency: "INR",
          subtotal,
          total: subtotal,
          items: { create: items },
        },
        select: { id: true },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart!.id } });
      return order.id;
    });
    this.logger.log({ userId: user.id, orderId: id }, "Order created from cart");
    return this.get(user, id);
  }
}

function toResponse(row: OrderRow): OrderDto {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    currency: row.currency,
    subtotal: row.subtotal,
    total: row.total,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productNameSnapshot,
      sku: item.skuSnapshot,
      unitPrice: item.priceSnapshot,
      quantity: item.quantity,
      total: item.total,
    })),
    placedAt: row.placedAt,
    createdAt: row.createdAt,
  };
}
