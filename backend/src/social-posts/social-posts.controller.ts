import {
  Body,
  Controller,
  Delete,
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
  AdminSocialPostQueryDto,
  CreateSocialPostDto,
  ReorderSocialPostsDto,
  UpdateSocialPostDto,
} from "./dto/social-post-input.dto.js";
import { AdminSocialPostDto, SocialPostSummaryDto } from "./dto/social-post-response.dto.js";
import { SocialPostsService } from "./social-posts.service.js";

@ApiTags("social-posts")
@Public()
@Controller("social-posts")
export class SocialPostsController {
  constructor(private readonly service: SocialPostsService) {}

  @Get()
  @ApiOperation({ summary: "Published social/Instagram posts in display order" })
  @ApiDataResponse(SocialPostSummaryDto, { isArray: true })
  list(): Promise<SocialPostSummaryDto[]> {
    return this.service.listPublic();
  }
}

@ApiTags("admin: social-posts")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/social-posts")
export class AdminSocialPostsController {
  constructor(private readonly service: SocialPostsService) {}

  @Get()
  @ApiOperation({ summary: "Social posts in any status (admin)" })
  @ApiDataResponse(AdminSocialPostDto, { isArray: true })
  list(@Query() query: AdminSocialPostQueryDto): Promise<AdminSocialPostDto[]> {
    return this.service.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a social post (admin)" })
  @ApiDataResponse(AdminSocialPostDto, { status: 201 })
  @ApiErrorResponses(400)
  create(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateSocialPostDto,
  ): Promise<AdminSocialPostDto> {
    return this.service.create(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a social post (admin)" })
  @ApiDataResponse(AdminSocialPostDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminSocialPostDto> {
    return this.service.adminGet(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or unpublish a social post (admin)" })
  @ApiDataResponse(AdminSocialPostDto)
  @ApiErrorResponses(400, 404)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateSocialPostDto,
  ): Promise<AdminSocialPostDto> {
    return this.service.update(admin, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archive a social post (admin)" })
  @ApiDataResponse(AdminSocialPostDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminSocialPostDto> {
    return this.service.archive(admin, id);
  }

  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Archive a social post via POST (admin)" })
  @ApiDataResponse(AdminSocialPostDto)
  @ApiErrorResponses(400, 404)
  archivePost(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminSocialPostDto> {
    return this.service.archive(admin, id);
  }


  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder social posts (admin)" })
  @ApiDataResponse(AdminSocialPostDto, { isArray: true })
  @ApiErrorResponses(400)
  reorder(
    @CurrentUser() admin: AuthUser,
    @Body() dto: ReorderSocialPostsDto,
  ): Promise<AdminSocialPostDto[]> {
    return this.service.reorder(admin, dto);
  }
}
