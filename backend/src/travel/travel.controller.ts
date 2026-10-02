import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import {
  AdminTravelListQueryDto,
  CreateDestinationDto,
  CreateTripDto,
  TravelListQueryDto,
  UpdateDestinationDto,
  UpdateTripDto,
} from "./dto/travel-input.dto.js";
import {
  AdminDestinationDto,
  AdminTripDto,
  DestinationDetailDto,
  DestinationSummaryDto,
  TripDetailDto,
  TripSummaryDto,
} from "./dto/travel-response.dto.js";
import { TravelService } from "./travel.service.js";

@ApiTags("travel")
@Public()
@Controller()
export class TravelController {
  constructor(private readonly travel: TravelService) {}

  @Get("destinations")
  @ApiOperation({ summary: "Published destinations, featured first" })
  @ApiDataResponse(DestinationSummaryDto, { isArray: true })
  @ApiErrorResponses(400)
  listDestinations(@Query() query: TravelListQueryDto): Promise<DestinationSummaryDto[]> {
    return this.travel.listDestinations(query);
  }

  @Get("destinations/:slug")
  @ApiOperation({ summary: "A published destination with gallery and linked rides" })
  @ApiDataResponse(DestinationDetailDto)
  @ApiErrorResponses(404)
  getDestination(@Param("slug") slug: string): Promise<DestinationDetailDto> {
    return this.travel.getDestination(slug);
  }

  @Get("trips")
  @ApiOperation({ summary: "Published trips, soonest departure first" })
  @ApiDataResponse(TripSummaryDto, { isArray: true })
  @ApiErrorResponses(400)
  listTrips(@Query() query: TravelListQueryDto): Promise<TripSummaryDto[]> {
    return this.travel.listTrips(query);
  }

  @Get("trips/:slug")
  @ApiOperation({ summary: "A published trip with itinerary, departures and gallery" })
  @ApiDataResponse(TripDetailDto)
  @ApiErrorResponses(404)
  getTrip(@Param("slug") slug: string): Promise<TripDetailDto> {
    return this.travel.getTrip(slug);
  }
}

@ApiTags("admin: destinations")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/destinations")
export class AdminDestinationsController {
  constructor(private readonly travel: TravelService) {}

  @Get()
  @ApiOperation({ summary: "Destinations in any status (admin)" })
  @ApiDataResponse(AdminDestinationDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminTravelListQueryDto): Promise<AdminDestinationDto[]> {
    return this.travel.adminListDestinations(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a destination (admin)" })
  @ApiDataResponse(AdminDestinationDto, { status: 201 })
  @ApiErrorResponses(400, 409)
  create(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateDestinationDto,
  ): Promise<AdminDestinationDto> {
    return this.travel.createDestination(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a destination (admin)" })
  @ApiDataResponse(AdminDestinationDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminDestinationDto> {
    return this.travel.adminGetDestination(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update, publish or archive a destination (admin)" })
  @ApiDataResponse(AdminDestinationDto)
  @ApiErrorResponses(400, 404, 409)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateDestinationDto,
  ): Promise<AdminDestinationDto> {
    return this.travel.updateDestination(admin, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archive a destination (admin). Restore by setting status." })
  @ApiDataResponse(AdminDestinationDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminDestinationDto> {
    return this.travel.archiveDestination(admin, id);
  }
}

@ApiTags("admin: trips")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin/trips")
export class AdminTripsController {
  constructor(private readonly travel: TravelService) {}

  @Get()
  @ApiOperation({ summary: "Trips in any status, with all departures (admin)" })
  @ApiDataResponse(AdminTripDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminTravelListQueryDto): Promise<AdminTripDto[]> {
    return this.travel.adminListTrips(query);
  }

  @Post()
  @ApiOperation({ summary: "Create a trip with itinerary and departures (admin)" })
  @ApiDataResponse(AdminTripDto, { status: 201 })
  @ApiErrorResponses(400, 409, 422)
  create(@CurrentUser() admin: AuthUser, @Body() dto: CreateTripDto): Promise<AdminTripDto> {
    return this.travel.createTrip(admin, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a trip (admin)" })
  @ApiDataResponse(AdminTripDto)
  @ApiErrorResponses(400, 404)
  get(@Param("id", ParseUuidPipe) id: string): Promise<AdminTripDto> {
    return this.travel.adminGetTrip(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update, publish or archive a trip (admin)",
    description:
      "`itinerary` replaces all days; `departures` is the full list (rows keep their ids).",
  })
  @ApiDataResponse(AdminTripDto)
  @ApiErrorResponses(400, 404, 409, 422)
  update(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: UpdateTripDto,
  ): Promise<AdminTripDto> {
    return this.travel.updateTrip(admin, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Archive a trip (admin). Restore by setting status." })
  @ApiDataResponse(AdminTripDto)
  @ApiErrorResponses(400, 404)
  archive(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminTripDto> {
    return this.travel.archiveTrip(admin, id);
  }
}
