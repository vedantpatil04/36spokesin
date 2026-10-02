import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import {
  AdminCommunityQueryDto,
  CreateFounderDto,
  CreateGroupDto,
  CreateRiderSpotlightDto,
  CreateStoryDto,
  ReorderDto,
  StoryListQueryDto,
  UpdateFounderDto,
  UpdateGroupDto,
  UpdateRiderSpotlightDto,
  UpdateStoryDto,
} from "./dto/community-input.dto.js";
import {
  AdminFounderDto,
  AdminGroupDto,
  AdminRiderSpotlightDto,
  AdminStoryDto,
  FounderDto,
  GroupDto,
  RiderSpotlightDto,
  StoryDetailDto,
  StorySummaryDto,
} from "./dto/community-response.dto.js";
import { FoundersService } from "./founders.service.js";
import { GroupsService } from "./groups.service.js";
import { RiderSpotlightsService } from "./rider-spotlights.service.js";
import { StoriesService } from "./stories.service.js";

@ApiTags("community")
@Public()
@Controller("community")
export class CommunityController {
  constructor(
    private readonly founders: FoundersService,
    private readonly stories: StoriesService,
    private readonly riders: RiderSpotlightsService,
    private readonly groups: GroupsService,
  ) {}

  @Get("founders")
  @ApiOperation({ summary: "Published founders in display order" })
  @ApiDataResponse(FounderDto, { isArray: true })
  listFounders(): Promise<FounderDto[]> {
    return this.founders.listPublic();
  }

  @Get("stories")
  @ApiOperation({ summary: "Published rider stories: featured first, then display order, newest" })
  @ApiDataResponse(StorySummaryDto, { isArray: true })
  @ApiErrorResponses(400)
  listStories(@Query() query: StoryListQueryDto): Promise<StorySummaryDto[]> {
    return this.stories.listPublic(query);
  }

  @Get("stories/:slug")
  @ApiOperation({ summary: "A published rider story" })
  @ApiDataResponse(StoryDetailDto)
  @ApiErrorResponses(404)
  getStory(@Param("slug") slug: string): Promise<StoryDetailDto> {
    return this.stories.getPublic(slug);
  }

  @Get("riders")
  @ApiOperation({ summary: "Published rider spotlights in display order" })
  @ApiDataResponse(RiderSpotlightDto, { isArray: true })
  listRiders(): Promise<RiderSpotlightDto[]> {
    return this.riders.listPublic();
  }

  @Get("groups")
  @ApiOperation({ summary: "Published groups and chapters in display order" })
  @ApiDataResponse(GroupDto, { isArray: true })
  listGroups(): Promise<GroupDto[]> {
    return this.groups.listPublic();
  }

  @Get("groups/:slug")
  @ApiOperation({ summary: "A published group" })
  @ApiDataResponse(GroupDto)
  @ApiErrorResponses(404)
  getGroup(@Param("slug") slug: string): Promise<GroupDto> {
    return this.groups.getPublic(slug);
  }
}

@ApiTags("admin: community founders")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/community/founders")
export class AdminFoundersController {
  constructor(private readonly service: FoundersService) {}

  @Get()
  @ApiOperation({ summary: "Founders in any status, in display order (admin)" })
  @ApiDataResponse(AdminFounderDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminCommunityQueryDto): Promise<AdminFounderDto[]> {
    return this.service.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a founder (admin)" })
  @ApiDataResponse(AdminFounderDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateFounderDto): Promise<AdminFounderDto> {
    return this.service.create(admin, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder founders (admin)" })
  @ApiDataResponse(AdminFounderDto, { isArray: true })
  @ApiErrorResponses(400, 422)
  reorder(@CurrentUser() admin: AuthUser, @Body() dto: ReorderDto): Promise<AdminFounderDto[]> {
    return this.service.reorder(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a founder (admin)" })
  @ApiDataResponse(AdminFounderDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminFounderDto> {
    return this.service.adminGet(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or unpublish a founder (admin)" })
  @ApiDataResponse(AdminFounderDto)
  @ApiErrorResponses(400, 404, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateFounderDto,
  ): Promise<AdminFounderDto> {
    return this.service.update(admin, id, dto);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a founder (admin). Restore by setting status." })
  @ApiDataResponse(AdminFounderDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminFounderDto> {
    return this.service.archive(admin, id);
  }
}

@ApiTags("admin: community stories")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/community/stories")
export class AdminStoriesController {
  constructor(private readonly service: StoriesService) {}

  @Get()
  @ApiOperation({ summary: "Stories in any status, in display order (admin)" })
  @ApiDataResponse(AdminStoryDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminCommunityQueryDto): Promise<AdminStoryDto[]> {
    return this.service.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a story (admin)" })
  @ApiDataResponse(AdminStoryDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateStoryDto): Promise<AdminStoryDto> {
    return this.service.create(admin, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder stories (admin)" })
  @ApiDataResponse(AdminStoryDto, { isArray: true })
  @ApiErrorResponses(400, 422)
  reorder(@CurrentUser() admin: AuthUser, @Body() dto: ReorderDto): Promise<AdminStoryDto[]> {
    return this.service.reorder(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a story (admin)" })
  @ApiDataResponse(AdminStoryDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminStoryDto> {
    return this.service.adminGet(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or unpublish a story (admin)" })
  @ApiDataResponse(AdminStoryDto)
  @ApiErrorResponses(400, 404, 409, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateStoryDto,
  ): Promise<AdminStoryDto> {
    return this.service.update(admin, id, dto);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a story (admin). Restore by setting status." })
  @ApiDataResponse(AdminStoryDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminStoryDto> {
    return this.service.archive(admin, id);
  }
}

@ApiTags("admin: community rider spotlights")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/community/riders")
export class AdminRiderSpotlightsController {
  constructor(private readonly service: RiderSpotlightsService) {}

  @Get()
  @ApiOperation({ summary: "Rider spotlights in any status, in display order (admin)" })
  @ApiDataResponse(AdminRiderSpotlightDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminCommunityQueryDto): Promise<AdminRiderSpotlightDto[]> {
    return this.service.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a rider spotlight (admin)" })
  @ApiDataResponse(AdminRiderSpotlightDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  create(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateRiderSpotlightDto,
  ): Promise<AdminRiderSpotlightDto> {
    return this.service.create(admin, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder rider spotlights (admin)" })
  @ApiDataResponse(AdminRiderSpotlightDto, { isArray: true })
  @ApiErrorResponses(400, 422)
  reorder(
    @CurrentUser() admin: AuthUser,
    @Body() dto: ReorderDto,
  ): Promise<AdminRiderSpotlightDto[]> {
    return this.service.reorder(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a rider spotlight (admin)" })
  @ApiDataResponse(AdminRiderSpotlightDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminRiderSpotlightDto> {
    return this.service.adminGet(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or unpublish a rider spotlight (admin)" })
  @ApiDataResponse(AdminRiderSpotlightDto)
  @ApiErrorResponses(400, 404, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateRiderSpotlightDto,
  ): Promise<AdminRiderSpotlightDto> {
    return this.service.update(admin, id, dto);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a rider spotlight (admin). Restore by setting status." })
  @ApiDataResponse(AdminRiderSpotlightDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminRiderSpotlightDto> {
    return this.service.archive(admin, id);
  }
}

@ApiTags("admin: community groups")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/community/groups")
export class AdminGroupsController {
  constructor(private readonly service: GroupsService) {}

  @Get()
  @ApiOperation({ summary: "Groups in any status, in display order (admin)" })
  @ApiDataResponse(AdminGroupDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminCommunityQueryDto): Promise<AdminGroupDto[]> {
    return this.service.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a group (admin)" })
  @ApiDataResponse(AdminGroupDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateGroupDto): Promise<AdminGroupDto> {
    return this.service.create(admin, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder groups (admin)" })
  @ApiDataResponse(AdminGroupDto, { isArray: true })
  @ApiErrorResponses(400, 422)
  reorder(@CurrentUser() admin: AuthUser, @Body() dto: ReorderDto): Promise<AdminGroupDto[]> {
    return this.service.reorder(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a group (admin)" })
  @ApiDataResponse(AdminGroupDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminGroupDto> {
    return this.service.adminGet(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or unpublish a group (admin)" })
  @ApiDataResponse(AdminGroupDto)
  @ApiErrorResponses(400, 404, 409, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<AdminGroupDto> {
    return this.service.update(admin, id, dto);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a group (admin). Restore by setting status." })
  @ApiDataResponse(AdminGroupDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminGroupDto> {
    return this.service.archive(admin, id);
  }
}
