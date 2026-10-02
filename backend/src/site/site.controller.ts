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
  CreateHeroSlideDto,
  ReorderHeroSlidesDto,
  UpdateHeroSlideDto,
} from "./dto/hero-slide-input.dto.js";
import { HeroSlideDto } from "./dto/hero-slide-response.dto.js";
import { ReorderPathCardsDto, UpdatePathCardDto } from "./dto/path-card-input.dto.js";
import { PathCardDto } from "./dto/path-card-response.dto.js";
import { SiteService } from "./site.service.js";

@ApiTags("site")
@Public()
@Controller("site")
export class SiteController {
  constructor(private readonly service: SiteService) {}

  @Get("hero-slides")
  @ApiOperation({ summary: "Published hero slides for homepage carousel in display order" })
  @ApiDataResponse(HeroSlideDto, { isArray: true })
  listHeroSlides(): Promise<HeroSlideDto[]> {
    return this.service.listPublicHeroSlides();
  }

  @Get("path-cards")
  @ApiOperation({ summary: "Published path cards in display order" })
  @ApiDataResponse(PathCardDto, { isArray: true })
  listPathCards(): Promise<PathCardDto[]> {
    return this.service.listPublicPathCards();
  }
}

@ApiTags("admin: site")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/site")
export class AdminSiteController {
  constructor(private readonly service: SiteService) {}

  // ─── Hero Slides ──────────────────────────────────────────────────────────

  @Get("hero-slides")
  @ApiOperation({ summary: "All hero slides in display order (admin)" })
  @ApiDataResponse(HeroSlideDto, { isArray: true })
  listHeroSlides(): Promise<HeroSlideDto[]> {
    return this.service.adminListHeroSlides();
  }

  @Post("hero-slides")
  @ApiOperation({ summary: "Create a hero slide (admin)" })
  @ApiDataResponse(HeroSlideDto, { status: 201 })
  @ApiErrorResponses(400)
  createHeroSlide(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateHeroSlideDto,
  ): Promise<HeroSlideDto> {
    return this.service.createHeroSlide(admin, dto);
  }

  @Get("hero-slides/:id")
  @ApiOperation({ summary: "Get a hero slide (admin)" })
  @ApiDataResponse(HeroSlideDto)
  @ApiErrorResponses(400, 404)
  getHeroSlide(@Param("id", ParseUuidPipe) id: string): Promise<HeroSlideDto> {
    return this.service.adminGetHeroSlide(id);
  }

  @Patch("hero-slides/reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set display order of hero slides (admin)" })
  @ApiDataResponse(HeroSlideDto, { isArray: true })
  @ApiErrorResponses(400)
  reorderHeroSlides(@Body() dto: ReorderHeroSlidesDto): Promise<HeroSlideDto[]> {
    return this.service.reorderHeroSlides(dto);
  }

  @Patch("hero-slides/:id")
  @ApiOperation({ summary: "Update a hero slide (admin)" })
  @ApiDataResponse(HeroSlideDto)
  @ApiErrorResponses(400, 404)
  updateHeroSlide(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateHeroSlideDto,
  ): Promise<HeroSlideDto> {
    return this.service.updateHeroSlide(admin, id, dto);
  }

  @Delete("hero-slides/:id")
  @ApiOperation({ summary: "Archive a hero slide (admin)" })
  @ApiDataResponse(HeroSlideDto)
  @ApiErrorResponses(400, 404)
  archiveHeroSlide(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<HeroSlideDto> {
    return this.service.archiveHeroSlide(admin, id);
  }

  // ─── Path Cards ───────────────────────────────────────────────────────────

  @Get("path-cards")
  @ApiOperation({ summary: "All path cards in display order (admin)" })
  @ApiDataResponse(PathCardDto, { isArray: true })
  listPathCards(): Promise<PathCardDto[]> {
    return this.service.adminListPathCards();
  }

  @Get("path-cards/:id")
  @ApiOperation({ summary: "Get a path card (admin)" })
  @ApiDataResponse(PathCardDto)
  @ApiErrorResponses(400, 404)
  getPathCard(@Param("id", ParseUuidPipe) id: string): Promise<PathCardDto> {
    return this.service.adminGetPathCard(id);
  }

  @Patch("path-cards/reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set display order of path cards (admin)" })
  @ApiDataResponse(PathCardDto, { isArray: true })
  @ApiErrorResponses(400)
  reorderPathCards(@Body() dto: ReorderPathCardsDto): Promise<PathCardDto[]> {
    return this.service.reorderPathCards(dto);
  }

  @Patch("path-cards/:id")
  @ApiOperation({ summary: "Update a path card (admin)" })
  @ApiDataResponse(PathCardDto)
  @ApiErrorResponses(400, 404)
  updatePathCard(
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdatePathCardDto,
  ): Promise<PathCardDto> {
    return this.service.updatePathCard(id, dto);
  }
}
