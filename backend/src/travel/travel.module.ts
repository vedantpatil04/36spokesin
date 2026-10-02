import { Module } from "@nestjs/common";
import { GalleriesModule } from "../galleries/galleries.module.js";
import {
  AdminDestinationsController,
  AdminTripsController,
  TravelController,
} from "./travel.controller.js";
import { TravelMapper } from "./travel.mapper.js";
import { TravelService } from "./travel.service.js";

/** Travel: destinations and trips (itineraries, departures), public and admin. */
@Module({
  imports: [GalleriesModule],
  controllers: [TravelController, AdminDestinationsController, AdminTripsController],
  providers: [TravelService, TravelMapper],
})
export class TravelModule {}
