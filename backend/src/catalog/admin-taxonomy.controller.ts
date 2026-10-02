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
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { BrandDto, CategoryDto } from "./dto/catalog-response.dto.js";
import {
  CreateBrandDto,
  CreateCategoryDto,
  UpdateBrandDto,
  UpdateCategoryDto,
} from "./dto/taxonomy-input.dto.js";
import { TaxonomyService } from "./taxonomy.service.js";

@ApiTags("admin: categories and brands")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get("categories")
  @ApiOperation({ summary: "List categories with product counts in any status (admin)" })
  @ApiDataResponse(CategoryDto, { isArray: true })
  listCategories(): Promise<CategoryDto[]> {
    return this.taxonomy.listCategories({ admin: true });
  }

  @Post("categories")
  @ApiOperation({ summary: "Create a category (admin)" })
  @ApiDataResponse(CategoryDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  createCategory(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryDto> {
    return this.taxonomy.createCategory(admin, dto);
  }

  @Patch("categories/:id")
  @ApiOperation({ summary: "Update a category (admin)" })
  @ApiDataResponse(CategoryDto)
  @ApiErrorResponses(400, 404, 409, 422)
  updateCategory(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    return this.taxonomy.updateCategory(admin, id, dto);
  }

  @Delete("categories/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an empty category (admin)" })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrorResponses(400, 404, 409)
  deleteCategory(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<void> {
    return this.taxonomy.deleteCategory(admin, id);
  }

  @Get("brands")
  @ApiOperation({ summary: "List product brands (admin)" })
  @ApiDataResponse(BrandDto, { isArray: true })
  listBrands(): Promise<BrandDto[]> {
    return this.taxonomy.listBrands();
  }

  @Post("brands")
  @ApiOperation({ summary: "Create a product brand (admin)" })
  @ApiDataResponse(BrandDto, { status: 201 })
  @ApiErrorResponses(400, 409)
  createBrand(@CurrentUser() admin: AuthUser, @Body() dto: CreateBrandDto): Promise<BrandDto> {
    return this.taxonomy.createBrand(admin, dto);
  }

  @Patch("brands/:id")
  @ApiOperation({ summary: "Update a product brand (admin)" })
  @ApiDataResponse(BrandDto)
  @ApiErrorResponses(400, 404, 409)
  updateBrand(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ): Promise<BrandDto> {
    return this.taxonomy.updateBrand(admin, id, dto);
  }

  @Delete("brands/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a brand no product uses (admin)" })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrorResponses(400, 404, 409)
  deleteBrand(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<void> {
    return this.taxonomy.deleteBrand(admin, id);
  }
}
