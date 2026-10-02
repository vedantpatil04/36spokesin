import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { CursorPaginationQueryDto } from "../common/pagination/cursor-pagination.dto.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { CartService } from "./cart.service.js";
import {
  AddCartItemDto,
  AddWishlistItemDto,
  CartDto,
  OrderDto,
  UpdateCartItemDto,
  WishlistItemDto,
} from "./dto/commerce.dto.js";
import { OrdersService } from "./orders.service.js";
import { WishlistService } from "./wishlist.service.js";

@ApiTags("cart")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("cart")
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: "Your cart, priced from the live catalogue" })
  @ApiDataResponse(CartDto)
  view(@CurrentUser() user: AuthUser): Promise<CartDto> {
    return this.cart.view(user);
  }

  @Post("items")
  @ApiOperation({ summary: "Add a product (adds to any quantity already in the cart)" })
  @ApiDataResponse(CartDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto): Promise<CartDto> {
    return this.cart.addItem(user, dto);
  }

  @Patch("items/:id")
  @ApiOperation({ summary: "Set a line's quantity" })
  @ApiDataResponse(CartDto)
  @ApiErrorResponses(400, 404, 422)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartDto> {
    return this.cart.updateItem(user, id, dto);
  }

  @Delete("items/:id")
  @ApiOperation({ summary: "Remove a line; returns the updated cart" })
  @ApiDataResponse(CartDto)
  @ApiErrorResponses(400, 404)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<CartDto> {
    return this.cart.removeItem(user, id);
  }

  @Delete()
  @ApiOperation({ summary: "Empty the cart; returns the empty cart" })
  @ApiDataResponse(CartDto)
  clear(@CurrentUser() user: AuthUser): Promise<CartDto> {
    return this.cart.clear(user);
  }
}

@ApiTags("wishlist")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  @ApiOperation({ summary: "Your saved products, newest first" })
  @ApiDataResponse(WishlistItemDto, { isArray: true })
  list(@CurrentUser() user: AuthUser): Promise<WishlistItemDto[]> {
    return this.wishlist.list(user);
  }

  @Post("items")
  @ApiOperation({ summary: "Save a product (idempotent)" })
  @ApiDataResponse(WishlistItemDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  add(@CurrentUser() user: AuthUser, @Body() dto: AddWishlistItemDto): Promise<WishlistItemDto> {
    return this.wishlist.add(user, dto.productId);
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a saved product" })
  @ApiNoContentResponse({ description: "Removed" })
  @ApiErrorResponses(400, 404)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<void> {
    return this.wishlist.remove(user, id);
  }
}

@ApiTags("orders")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Your orders, newest first" })
  @ApiDataResponse(OrderDto, { paginated: true })
  @ApiErrorResponses(400)
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: CursorPaginationQueryDto,
  ): Promise<CursorPage<OrderDto>> {
    return this.orders.list(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "One of your orders" })
  @ApiDataResponse(OrderDto)
  @ApiErrorResponses(400, 404)
  get(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<OrderDto> {
    return this.orders.get(user, id);
  }
}
