import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import {
  AdminSocialPostsController,
  SocialPostsController,
} from "./social-posts.controller.js";
import { SocialPostsService } from "./social-posts.service.js";

@Module({
  imports: [MediaModule],
  controllers: [SocialPostsController, AdminSocialPostsController],
  providers: [SocialPostsService],
  exports: [SocialPostsService],
})
export class SocialPostsModule {}
