import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module.js";
import { CartService } from "./cart.service.js";
import { CartController, OrdersController, WishlistController } from "./commerce.controller.js";
import { OrdersService } from "./orders.service.js";
import { WishlistService } from "./wishlist.service.js";

/** Cart, wishlist and the order foundation. No payment processing. */
@Module({
  imports: [CatalogModule],
  controllers: [CartController, WishlistController, OrdersController],
  providers: [CartService, WishlistService, OrdersService],
  exports: [OrdersService],
})
export class CommerceModule {}
