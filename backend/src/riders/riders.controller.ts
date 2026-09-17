import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { RiderProfileResponseDto } from "./dto/rider-profile-response.dto.js";
import { UpdateRiderProfileDto } from "./dto/update-rider-profile.dto.js";
import { RidersService } from "./riders.service.js";

@ApiTags("riders")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("riders")
export class RidersController {
  constructor(private readonly riders: RidersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get your rider profile" })
  @ApiDataResponse(RiderProfileResponseDto)
  me(@CurrentUser() user: AuthUser): Promise<RiderProfileResponseDto> {
    return this.riders.getOwn(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update your rider profile" })
  @ApiDataResponse(RiderProfileResponseDto)
  @ApiErrorResponses(400, 422)
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateRiderProfileDto,
  ): Promise<RiderProfileResponseDto> {
    return this.riders.updateOwn(user.id, dto);
  }
}
