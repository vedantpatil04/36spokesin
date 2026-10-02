import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module.js";
import { MediaModule } from "../media/media.module.js";
import { AdminBikesController } from "./admin-bikes.controller.js";
import { BikeMapper } from "./bike.mapper.js";
import { BikesController } from "./bikes.controller.js";
import { BikesService } from "./bikes.service.js";

/** Bike catalogue: brands, models and variants. */
@Module({
  imports: [MediaModule, CatalogModule],
  controllers: [BikesController, AdminBikesController],
  providers: [BikesService, BikeMapper],
  exports: [BikeMapper],
})
export class BikesModule {}
