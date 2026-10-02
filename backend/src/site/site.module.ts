import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AdminSiteController, SiteController } from "./site.controller.js";
import { SiteService } from "./site.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [SiteController, AdminSiteController],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
