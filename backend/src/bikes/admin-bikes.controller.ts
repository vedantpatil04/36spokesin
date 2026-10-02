import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { BikesService } from "./bikes.service.js";
import {
  CreateBikeBrandDto,
  CreateBikeModelDto,
  CreateBikeVariantDto,
  UpdateBikeBrandDto,
  UpdateBikeModelDto,
  UpdateBikeVariantDto,
} from "./dto/bike-input.dto.js";
import { AdminBikeModelDto, BikeBrandDto } from "./dto/bike-response.dto.js";

export class AdminBikeListQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  brandId?: string;
}

@ApiTags("admin: bikes")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminBikesController {
  constructor(private readonly bikes: BikesService) {}

  @Get("bike-brands")
  @ApiOperation({ summary: "List bike brands, including archived (admin)" })
  @ApiDataResponse(BikeBrandDto, { isArray: true })
  listBrands(): Promise<BikeBrandDto[]> {
    return this.bikes.listBrands();
  }

  @Post("bike-brands")
  @ApiOperation({ summary: "Create a bike brand (admin)" })
  @ApiDataResponse(BikeBrandDto, { status: 201 })
  @ApiErrorResponses(400, 409)
  createBrand(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateBikeBrandDto,
  ): Promise<BikeBrandDto> {
    return this.bikes.createBrand(admin, dto);
  }

  @Patch("bike-brands/:id")
  @ApiOperation({ summary: "Rename, archive or restore a bike brand (admin)" })
  @ApiDataResponse(BikeBrandDto)
  @ApiErrorResponses(400, 404, 409)
  updateBrand(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateBikeBrandDto,
  ): Promise<BikeBrandDto> {
    return this.bikes.updateBrand(admin, id, dto);
  }

  @Get("bikes")
  @ApiOperation({ summary: "List bike models, including archived (admin)" })
  @ApiDataResponse(AdminBikeModelDto, { isArray: true })
  @ApiErrorResponses(400)
  listModels(@Query() query: AdminBikeListQueryDto): Promise<AdminBikeModelDto[]> {
    return this.bikes.listModels(query.brandId);
  }

  @Post("bikes")
  @ApiOperation({ summary: "Create a bike model (admin)" })
  @ApiDataResponse(AdminBikeModelDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  createModel(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateBikeModelDto,
  ): Promise<AdminBikeModelDto> {
    return this.bikes.createModel(admin, dto);
  }

  @Get("bikes/:id")
  @ApiOperation({ summary: "Get a bike model (admin)" })
  @ApiDataResponse(AdminBikeModelDto)
  @ApiErrorResponses(400, 404)
  getModel(@Param("id", ParseUuidPipe) id: string): Promise<AdminBikeModelDto> {
    return this.bikes.getModel(id);
  }

  @Patch("bikes/:id")
  @ApiOperation({ summary: "Update, archive or restore a bike model (admin)" })
  @ApiDataResponse(AdminBikeModelDto)
  @ApiErrorResponses(400, 404, 409, 422)
  updateModel(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateBikeModelDto,
  ): Promise<AdminBikeModelDto> {
    return this.bikes.updateModel(admin, id, dto);
  }

  @Delete("bikes/:id")
  @ApiOperation({
    summary: "Archive a bike model (admin)",
    description:
      "Hidden from the public catalogue; riders' garages and fitment keep it. Restore with PATCH.",
  })
  @ApiDataResponse(AdminBikeModelDto)
  @ApiErrorResponses(400, 404)
  archiveModel(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminBikeModelDto> {
    return this.bikes.archiveModel(admin, id);
  }

  @Post("bikes/:id/variants")
  @ApiOperation({ summary: "Add a variant (admin)" })
  @ApiDataResponse(AdminBikeModelDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409)
  createVariant(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: CreateBikeVariantDto,
  ): Promise<AdminBikeModelDto> {
    return this.bikes.createVariant(admin, id, dto);
  }

  @Patch("bikes/:id/variants/:variantId")
  @ApiOperation({ summary: "Rename, reorder, archive or restore a variant (admin)" })
  @ApiDataResponse(AdminBikeModelDto)
  @ApiErrorResponses(400, 404, 409)
  updateVariant(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("variantId", ParseUuidPipe) variantId: string,
    @Body() dto: UpdateBikeVariantDto,
  ): Promise<AdminBikeModelDto> {
    return this.bikes.updateVariant(admin, id, variantId, dto);
  }
}
