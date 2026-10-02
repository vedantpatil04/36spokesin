import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { AdminMediaAssetDto, AdminMediaQueryDto } from "./dto/admin-media.dto.js";
import { MediaLibraryService } from "./media-library.service.js";

@ApiTags("admin: media")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/media")
export class AdminMediaController {
  constructor(private readonly library: MediaLibraryService) {}

  @Get()
  @ApiOperation({ summary: "Catalogue media library with usage (admin)" })
  @ApiDataResponse(AdminMediaAssetDto, { paginated: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminMediaQueryDto): Promise<CursorPage<AdminMediaAssetDto>> {
    return this.library.list(query);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete an unused asset and its stored file (admin)",
    description: "Refused with 409 MEDIA_IN_USE while any record still uses the asset.",
  })
  @ApiNoContentResponse({ description: "Deleted" })
  @ApiErrorResponses(400, 404, 409)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<void> {
    return this.library.remove(user, id);
  }
}
