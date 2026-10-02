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
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import {
  AdminRideBookingDto,
  AdminRideDto,
  AdminRideListQueryDto,
  BookRideDto,
  CreateRideDto,
  MyRideDto,
  RideDetailDto,
  RideListQueryDto,
  RideRegistrationDto,
  RideSummaryDto,
  UpdateRideDto,
} from "./dto/ride.dto.js";
import { RidesService } from "./rides.service.js";

@ApiTags("rides")
@Controller("rides")
export class RidesController {
  constructor(private readonly rides: RidesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Public rides: upcoming (default) or past" })
  @ApiDataResponse(RideSummaryDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: RideListQueryDto): Promise<RideSummaryDto[]> {
    return this.rides.list(query);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "A public ride with gallery and spots left" })
  @ApiDataResponse(RideDetailDto)
  @ApiErrorResponses(404)
  get(@Param("slug") slug: string): Promise<RideDetailDto> {
    return this.rides.getBySlug(slug);
  }

  @ApiBearerAuth()
  @Get(":id/registration")
  @ApiOperation({ summary: "Your registration status on a ride" })
  @ApiDataResponse(RideRegistrationDto)
  @ApiErrorResponses(400, 401, 404)
  registration(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<RideRegistrationDto> {
    return this.rides.registration(user, id);
  }

  @ApiBearerAuth()
  @Post(":id/join")
  @ApiOperation({
    summary: "Book a ride",
    description:
      "Stores the booking against the signed-in rider. Refused when already booked (409), " +
      "full (422 RIDE_FULL), not open (422 RIDE_CLOSED) or when the bike is not the rider's " +
      "own (422 INVALID_REFERENCE). A free ride is confirmed at once. A paid ride is held as " +
      "PENDING_PAYMENT until a payment proof is approved; it is refused while no UPI details " +
      "are configured (422 PAYMENT_NOT_CONFIGURED).",
  })
  @ApiDataResponse(RideRegistrationDto, { status: 201 })
  @ApiErrorResponses(400, 401, 404, 409, 422)
  join(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: BookRideDto,
  ): Promise<RideRegistrationDto> {
    return this.rides.join(user, id, dto);
  }

  @ApiBearerAuth()
  @Delete(":id/join")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cancel your booking before the ride starts",
    description:
      "Keeps the booking as CANCELLED and frees its seat. Refused when there is no booking " +
      "(404), it is already cancelled (409) or the ride has started (422 RIDE_CLOSED).",
  })
  @ApiDataResponse(RideRegistrationDto)
  @ApiErrorResponses(400, 401, 404, 409, 422)
  leave(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<RideRegistrationDto> {
    return this.rides.leave(user, id);
  }
}

@ApiTags("rides")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("my-rides")
export class MyRidesController {
  constructor(private readonly rides: RidesService) {}

  @Get()
  @ApiOperation({ summary: "Your ride bookings, active and cancelled, soonest ride first" })
  @ApiDataResponse(MyRideDto, { isArray: true })
  list(@CurrentUser() user: AuthUser): Promise<MyRideDto[]> {
    return this.rides.myRides(user);
  }
}

@ApiTags("admin: rides")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/rides")
export class AdminRidesController {
  constructor(private readonly rides: RidesService) {}

  @Get()
  @ApiOperation({ summary: "Rides in any status, with registration counts (admin)" })
  @ApiDataResponse(AdminRideDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminRideListQueryDto): Promise<AdminRideDto[]> {
    return this.rides.adminList(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a ride (admin)" })
  @ApiDataResponse(AdminRideDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateRideDto): Promise<AdminRideDto> {
    return this.rides.create(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a ride (admin)" })
  @ApiDataResponse(AdminRideDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminRideDto> {
    return this.rides.adminGet(id);
  }

  @Get(":id/bookings")
  @ApiOperation({ summary: "Bookings on a ride, active first (admin)" })
  @ApiDataResponse(AdminRideBookingDto, { isArray: true })
  @ApiErrorResponses(400, 404)
  bookings(@Param("id", ParseUuidPipe) id: string): Promise<AdminRideBookingDto[]> {
    return this.rides.adminBookings(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a ride, its date, capacity or status (admin)" })
  @ApiDataResponse(AdminRideDto)
  @ApiErrorResponses(400, 404, 409, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateRideDto,
  ): Promise<AdminRideDto> {
    return this.rides.update(admin, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archive a ride (admin). Restore by setting status." })
  @ApiDataResponse(AdminRideDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminRideDto> {
    return this.rides.archive(admin, id);
  }
}
