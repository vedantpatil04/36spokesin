import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { RidersController } from "./riders.controller.js";
import { RidersService } from "./riders.service.js";

@Module({
  imports: [MediaModule],
  controllers: [RidersController],
  providers: [RidersService],
})
export class RidersModule {}
