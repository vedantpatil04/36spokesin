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
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { CursorPaginationQueryDto } from "../common/pagination/cursor-pagination.dto.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { CreateUploadDto } from "./dto/create-upload.dto.js";
import { MediaAssetResponseDto, UploadSessionResponseDto } from "./dto/media-asset-response.dto.js";
import { UpdateMediaAssetDto } from "./dto/update-media-asset.dto.js";
import { MediaService } from "./media.service.js";

@ApiTags("media")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Public()
  @Put("uploads/content")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Upload raw file content for streaming storage providers",
    description: "Accepts raw file binary body for presigned upload URLs with valid HMAC signature.",
  })
  async uploadContent(
    @Req() req: Request,
    @Query("key") key: string,
    @Query("expires") expiresStr: string,
    @Query("sig") sig: string,
  ): Promise<void> {
    const expires = Number(expiresStr);
    if (!key || !Number.isFinite(expires) || !sig) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.BAD_REQUEST,
        "Missing required upload signature parameters.",
      );
    }
    await this.media.handleStreamUpload(
      key,
      expires,
      sig,
      req,
      typeof req.headers["content-type"] === "string" ? req.headers["content-type"] : undefined,
    );
  }

  @Post("uploads")
  @ApiOperation({
    summary: "Start an upload",
    description:
      "Validates the file metadata and returns a short-lived pre-signed URL. PUT the raw file to " +
      "`upload.url` with `upload.headers`, then call `POST /media/{id}/complete`.",
  })
  @ApiDataResponse(UploadSessionResponseDto, { status: 201 })
  @ApiErrorResponses(400, 403, 422, 503)
  createUpload(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUploadDto,
  ): Promise<UploadSessionResponseDto> {
    return this.media.createUpload(user, dto);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify the uploaded file and mark the asset READY (idempotent)" })
  @ApiDataResponse(MediaAssetResponseDto)
  @ApiErrorResponses(400, 404, 422, 503)
  complete(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<MediaAssetResponseDto> {
    return this.media.completeUpload(user, id);
  }

  @Get()
  @ApiOperation({ summary: "List your uploaded media" })
  @ApiDataResponse(MediaAssetResponseDto, { paginated: true })
  @ApiErrorResponses(400)
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: CursorPaginationQueryDto,
  ): Promise<CursorPage<MediaAssetResponseDto>> {
    return this.media.listOwn(user, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a media asset (owner or admin)" })
  @ApiDataResponse(MediaAssetResponseDto)
  @ApiErrorResponses(400, 404)
  getOne(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<MediaAssetResponseDto> {
    return this.media.getOne(user, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update alt text (owner or admin)" })
  @ApiDataResponse(MediaAssetResponseDto)
  @ApiErrorResponses(400, 404)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateMediaAssetDto,
  ): Promise<MediaAssetResponseDto> {
    return this.media.update(user, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a media asset and its stored file (owner or admin)" })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrorResponses(400, 404)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<void> {
    return this.media.remove(user, id);
  }
}
