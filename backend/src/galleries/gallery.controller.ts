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
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ProductImageDto } from "../catalog/dto/catalog-response.dto.js";
import {
  AttachProductImageDto,
  ReorderProductImagesDto,
  ReplaceProductImageDto,
  UpdateProductImageDto,
} from "../catalog/dto/product-input.dto.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import type { GalleryOwner } from "./gallery-owners.js";
import { type GalleryList, GalleryService } from "./gallery.service.js";

export class GalleryListDto {
  @ApiProperty({ format: "uuid" })
  ownerId!: string;

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];
}

/**
 * Admin gallery endpoints, identical for destinations, trips and rides:
 *   GET/POST  /admin/{owner}s/:id/images
 *   POST      /admin/{owner}s/:id/images/reorder
 *   PATCH/DELETE /admin/{owner}s/:id/images/:imageId
 *   POST      /admin/{owner}s/:id/images/:imageId/primary | /replace
 * Upload first through POST /media/uploads with the owner's media category.
 */
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
abstract class GalleryController {
  protected abstract readonly owner: GalleryOwner;

  constructor(protected readonly galleries: GalleryService) {}

  @Get()
  @ApiOperation({ summary: "List the gallery in display order (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404)
  list(@Param("id", ParseUuidPipe) id: string): Promise<GalleryList> {
    return this.galleries.list(this.owner, id);
  }

  @Post()
  @ApiOperation({ summary: "Attach an uploaded image; the first becomes primary (admin)" })
  @ApiDataResponse(GalleryListDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409, 422)
  attach(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: AttachProductImageDto,
  ): Promise<GalleryList> {
    return this.galleries.attach(admin, this.owner, id, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Set the display order of every image (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404)
  reorder(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: ReorderProductImagesDto,
  ): Promise<GalleryList> {
    return this.galleries.reorder(admin, this.owner, id, dto);
  }

  @Patch(":imageId")
  @ApiOperation({ summary: "Edit alt text or caption (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
    @Body() dto: UpdateProductImageDto,
  ): Promise<GalleryList> {
    return this.galleries.update(admin, this.owner, id, imageId, dto);
  }

  @Delete(":imageId")
  @ApiOperation({ summary: "Remove an image; its file is deleted only when unused (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404)
  remove(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
  ): Promise<GalleryList> {
    return this.galleries.remove(admin, this.owner, id, imageId);
  }

  @Post(":imageId/primary")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Make an image the primary (hero and card) image (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404)
  setPrimary(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
  ): Promise<GalleryList> {
    return this.galleries.setPrimary(admin, this.owner, id, imageId);
  }

  @Post(":imageId/replace")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Swap the file behind an image, keeping its place (admin)" })
  @ApiDataResponse(GalleryListDto)
  @ApiErrorResponses(400, 404, 409, 422)
  replace(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Param("imageId", ParseUuidPipe) imageId: string,
    @Body() dto: ReplaceProductImageDto,
  ): Promise<GalleryList> {
    return this.galleries.replace(admin, this.owner, id, imageId, dto);
  }
}

@ApiTags("admin: destinations")
@Controller("admin/destinations/:id/images")
export class DestinationGalleryController extends GalleryController {
  protected readonly owner = "destination" as const;
}

@ApiTags("admin: trips")
@Controller("admin/trips/:id/images")
export class TripGalleryController extends GalleryController {
  protected readonly owner = "trip" as const;
}

@ApiTags("admin: rides")
@Controller("admin/rides/:id/images")
export class RideGalleryController extends GalleryController {
  protected readonly owner = "ride" as const;
}
