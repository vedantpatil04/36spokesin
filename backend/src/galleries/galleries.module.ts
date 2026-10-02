import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module.js";
import { MediaModule } from "../media/media.module.js";
import {
  DestinationGalleryController,
  RideGalleryController,
  TripGalleryController,
} from "./gallery.controller.js";
import { GalleryService } from "./gallery.service.js";

/** Photo galleries for destinations, trips and rides (admin CMS). */
@Module({
  imports: [MediaModule, CatalogModule],
  controllers: [DestinationGalleryController, TripGalleryController, RideGalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleriesModule {}
