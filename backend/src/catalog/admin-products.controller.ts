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
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { AdminProductsService } from "./admin-products.service.js";
import {
  AdminProductDto,
  AdminProductListItemDto,
  ProductImageListDto,
} from "./dto/catalog-response.dto.js";
import {
  AttachProductImageDto,
  CreateProductDto,
  ReorderProductImagesDto,
  ReplaceProductImageDto,
  UpdateProductDto,
  UpdateProductImageDto,
} from "./dto/product-input.dto.js";
import { AdminProductListQueryDto } from "./dto/product-query.dto.js";
import { ProductImagesService } from "./product-images.service.js";

@ApiTags("admin: products")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/products")
export class AdminProductsController {
  constructor(
    private readonly products: AdminProductsService,
    private readonly images: ProductImagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List products in any status (admin)" })
  @ApiDataResponse(AdminProductListItemDto, { paginated: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminProductListQueryDto): Promise<CursorPage<AdminProductListItemDto>> {
    return this.products.list(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a product (admin)" })
  @ApiDataResponse(AdminProductDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateProductDto): Promise<AdminProductDto> {
    return this.products.create(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a product in any status (admin)" })
  @ApiDataResponse(AdminProductDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminProductDto> {
    return this.products.get(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a product (admin)",
    description: "`specifications` and `compatibility`, when sent, replace the existing rows.",
  })
  @ApiDataResponse(AdminProductDto)
  @ApiErrorResponses(400, 404, 409, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<AdminProductDto> {
    return this.products.update(admin, id, dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Archive a product (admin)",
    description:
      "Products are archived, not deleted, so orders, carts and wishlists keep their history. " +
      "Restore by setting `status` back to DRAFT or PUBLISHED.",
  })
  @ApiDataResponse(AdminProductDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminProductDto> {
    return this.products.archive(admin, id);
  }

  @Post(":id/duplicate")
  @ApiOperation({ summary: "Copy a product as a new draft, sharing its images (admin)" })
  @ApiDataResponse(AdminProductDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409)
  duplicate(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminProductDto> {
    return this.products.duplicate(admin, id);
  }

  // ─── Gallery ─────────────────────────────────────────────────────────────

  @Get(":id/images")
  @ApiOperation({ summary: "List a product's images in display order (admin)" })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404)
  listImages(@Param("id", ParseUuidPipe) id: string): Promise<ProductImageListDto> {
    return this.images.list(id);
  }

  @Post(":id/images")
  @ApiOperation({
    summary: "Attach an uploaded image (admin)",
    description:
      "Upload first through `POST /media/uploads` (category PRODUCT) and `POST /media/{id}/complete`, " +
      "then attach the READY asset here. The first image becomes primary.",
  })
  @ApiDataResponse(ProductImageListDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409, 422)
  attachImage(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: AttachProductImageDto,
  ): Promise<ProductImageListDto> {
    return this.images.attach(admin, id, dto);
  }

  @Post(":id/images/reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set the display order of every image (admin)" })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404)
  reorderImages(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: ReorderProductImagesDto,
  ): Promise<ProductImageListDto> {
    return this.images.reorder(admin, id, dto);
  }

  @Patch(":id/images/:imageId")
  @ApiOperation({ summary: "Edit an image's alt text or caption (admin)" })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404)
  updateImage(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ): Promise<ProductImageListDto> {
    return this.images.update(admin, id, imageId, dto);
  }

  @Delete(":id/images/:imageId")
  @ApiOperation({
    summary: "Remove an image from the gallery (admin)",
    description: "The stored file is deleted only when no other record uses it.",
  })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404)
  removeImage(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
  ): Promise<ProductImageListDto> {
    return this.images.remove(admin, id, imageId);
  }

  @Post(":id/images/:imageId/primary")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Make an image the storefront thumbnail and hero (admin)" })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404)
  setPrimary(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
  ): Promise<ProductImageListDto> {
    return this.images.setPrimary(admin, id, imageId);
  }

  @Post(":id/images/:imageId/replace")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Swap the file behind an image, keeping its position (admin)",
    description: "The previous file is deleted only when no other record uses it.",
  })
  @ApiDataResponse(ProductImageListDto)
  @ApiErrorResponses(400, 404, 409, 422)
  replaceImage(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
    @Body() dto: ReplaceProductImageDto,
  ): Promise<ProductImageListDto> {
    return this.images.replace(admin, id, imageId, dto);
  }
}
