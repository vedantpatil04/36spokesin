import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import {
  AdminFoundersController,
  AdminGroupsController,
  AdminRiderSpotlightsController,
  AdminStoriesController,
  CommunityController,
} from "./community.controller.js";
import { CommunityMapper } from "./community.mapper.js";
import { FoundersService } from "./founders.service.js";
import { GroupsService } from "./groups.service.js";
import { RiderSpotlightsService } from "./rider-spotlights.service.js";
import { StoriesService } from "./stories.service.js";

/**
 * Phase 6 community: founders, rider stories, rider spotlights and groups.
 * Community events reuse Rides (RidesModule); nothing here duplicates them.
 */
@Module({
  imports: [MediaModule],
  controllers: [
    CommunityController,
    AdminFoundersController,
    AdminStoriesController,
    AdminRiderSpotlightsController,
    AdminGroupsController,
  ],
  providers: [
    CommunityMapper,
    FoundersService,
    StoriesService,
    RiderSpotlightsService,
    GroupsService,
  ],
})
export class CommunityModule {}
