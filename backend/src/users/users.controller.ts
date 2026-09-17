import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import type { CursorPage } from "../common/http/cursor-page.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { ListUsersQueryDto } from "./dto/list-users-query.dto.js";
import { UpdateMeDto } from "./dto/update-me.dto.js";
import { UserResponseDto } from "./dto/user-response.dto.js";
import { UsersService } from "./users.service.js";

@ApiTags("users")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get the signed-in account" })
  @ApiDataResponse(UserResponseDto)
  @ApiErrorResponses(403)
  me(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.users.getCurrent(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update the signed-in account's name or phone" })
  @ApiDataResponse(UserResponseDto)
  @ApiErrorResponses(400, 403)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto): Promise<UserResponseDto> {
    return this.users.updateCurrent(user.id, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "List accounts (admin)" })
  @ApiDataResponse(UserResponseDto, { paginated: true })
  @ApiErrorResponses(400, 403)
  list(@Query() query: ListUsersQueryDto): Promise<CursorPage<UserResponseDto>> {
    return this.users.list(query);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get an account by id (admin)" })
  @ApiDataResponse(UserResponseDto)
  @ApiErrorResponses(400, 403, 404)
  getById(@Param("id", ParseUuidPipe) id: string): Promise<UserResponseDto> {
    return this.users.getById(id);
  }
}
