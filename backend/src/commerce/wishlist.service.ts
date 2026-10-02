import { HttpStatus, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth-user.js";
import { CatalogMapper, productSummaryInclude } from "../catalog/catalog.mapper.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { notFound } from "../common/http/not-found.js";
import { PrismaService } from "../database/prisma.service.js";
import type { Prisma } from "../generated/prisma/client.js";
import { ProductStatus } from "../generated/prisma/enums.js";
import type { WishlistItemDto } from "./dto/commerce.dto.js";

export const MAX_WISHLIST_ITEMS = 200;

const wishlistInclude = {
  product: { include: productSummaryInclude },
} satisfies Prisma.WishlistItemInclude;

type WishlistRow = Prisma.WishlistItemGetPayload<{ include: typeof wishlistInclude }>;

@Injectable()
export class WishlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CatalogMapper,
  ) {}

  async list(user: AuthUser): Promise<WishlistItemDto[]> {
    const rows = await this.prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: wishlistInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return rows.map((row) => this.toResponse(row));
  }

  /** Idempotent: saving a product twice returns the existing entry. */
  async add(user: AuthUser, productId: string): Promise<WishlistItemDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.PRODUCT_UNAVAILABLE,
        "This product isn't available in the shop.",
      );
    }
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
      include: wishlistInclude,
    });
    if (existing) return this.toResponse(existing);

    if (
      (await this.prisma.wishlistItem.count({ where: { userId: user.id } })) >= MAX_WISHLIST_ITEMS
    ) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.LIMIT_REACHED,
        `A wishlist can hold up to ${MAX_WISHLIST_ITEMS} products.`,
      );
    }
    const row = await this.prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
      include: wishlistInclude,
    });
    return this.toResponse(row);
  }

  async remove(user: AuthUser, itemId: string): Promise<void> {
    const { count } = await this.prisma.wishlistItem.deleteMany({
      where: { id: itemId, userId: user.id },
    });
    if (count === 0) throw notFound("Wishlist item");
  }

  private toResponse(row: WishlistRow): WishlistItemDto {
    return {
      id: row.id,
      product: this.mapper.summary(row.product),
      available: row.product.status === ProductStatus.PUBLISHED,
      addedAt: row.createdAt,
    };
  }
}
