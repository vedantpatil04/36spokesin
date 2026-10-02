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
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { CreateRiderBikeDto, RiderBikeDto, UpdateRiderBikeDto } from "./dto/rider-bike.dto.js";
import { GarageService } from "./garage.service.js";

@ApiTags("my garage")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("my-bikes")
export class GarageController {
  constructor(private readonly garage: GarageService) {}

  @Get()
  @ApiOperation({ summary: "Your motorcycles, primary first" })
  @ApiDataResponse(RiderBikeDto, { isArray: true })
  list(@CurrentUser() user: AuthUser): Promise<RiderBikeDto[]> {
    return this.garage.list(user);
  }

  @Post()
  @ApiOperation({ summary: "Add a motorcycle to your garage" })
  @ApiDataResponse(RiderBikeDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRiderBikeDto): Promise<RiderBikeDto> {
    return this.garage.create(user, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get one of your motorcycles" })
  @ApiDataResponse(RiderBikeDto)
  @ApiErrorResponses(400, 404)
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<RiderBikeDto> {
    return this.garage.get(user, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Edit one of your motorcycles" })
  @ApiDataResponse(RiderBikeDto)
  @ApiErrorResponses(400, 404, 422)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateRiderBikeDto,
  ): Promise<RiderBikeDto> {
    return this.garage.update(user, id, dto);
  }

  @Post(":id/primary")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Make this your main motorcycle" })
  @ApiDataResponse(RiderBikeDto)
  @ApiErrorResponses(400, 404)
  setPrimary(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<RiderBikeDto> {
    return this.garage.setPrimary(user, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a motorcycle from your garage" })
  @ApiNoContentResponse({ description: "Removed" })
  @ApiErrorResponses(400, 404)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<void> {
    return this.garage.remove(user, id);
  }
}
