import { Module } from "@nestjs/common";
import { GalleriesModule } from "../galleries/galleries.module.js";
import { AdminRidesController, MyRidesController, RidesController } from "./rides.controller.js";
import { RidesService } from "./rides.service.js";

/** Rides, ride registration and the admin ride CMS. */
@Module({
  imports: [GalleriesModule],
  controllers: [RidesController, MyRidesController, AdminRidesController],
  providers: [RidesService],
})
export class RidesModule {}
