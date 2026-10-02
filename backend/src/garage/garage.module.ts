import { Module } from "@nestjs/common";
import { BikesModule } from "../bikes/bikes.module.js";
import { GarageController } from "./garage.controller.js";
import { GarageService } from "./garage.service.js";

/** My Garage: the motorcycles a rider owns. */
@Module({
  imports: [BikesModule],
  controllers: [GarageController],
  providers: [GarageService],
})
export class GarageModule {}
