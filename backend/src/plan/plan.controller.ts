import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import {
  PlanJourneyDto,
  PlannedJourneyDto,
  SaveJourneyDto,
  SavedJourneyDto,
  SavedJourneySummaryDto,
} from "./dto/plan.dto.js";
import { PlanRateLimit } from "./plan-rate-limit.decorator.js";
import { PlanService, type PlannedJourney } from "./plan.service.js";
import { SavedJourneysService } from "./saved-journeys.service.js";

@ApiTags("journeys")
@Controller("journeys")
export class JourneyPlanController {
  constructor(private readonly plans: PlanService) {}

  @Public()
  @PlanRateLimit()
  @Post("plan")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Plan a motorcycle journey from real route, weather and place data",
    description:
      "No account needed. Places, distance, riding time and weather come from the data sources " +
      "named in the plan; an AI model lays out the days and stops from those facts and its " +
      "answer is validated against them. Fails with 422 LOCATION_NOT_FOUND / ROUTE_NOT_FOUND / " +
      "JOURNEY_TOO_LONG, or 503 ROUTE_UNAVAILABLE / PLANNING_UNAVAILABLE. Rate limited.",
  })
  @ApiDataResponse(PlannedJourneyDto)
  @ApiErrorResponses(400, 422, 429, 503)
  plan(@Body() dto: PlanJourneyDto): Promise<PlannedJourney> {
    return this.plans.plan(dto);
  }
}

@ApiTags("journeys")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller("my-journeys")
export class MyJourneysController {
  constructor(private readonly journeys: SavedJourneysService) {}

  @Get()
  @ApiOperation({ summary: "Journeys you saved, newest first" })
  @ApiDataResponse(SavedJourneySummaryDto, { isArray: true })
  list(@CurrentUser() user: AuthUser): Promise<SavedJourneySummaryDto[]> {
    return this.journeys.list(user);
  }

  @Post()
  @ApiOperation({
    summary: "Save a plan returned by POST /journeys/plan",
    description:
      "Send the plan back unchanged with its token. Refused when the plan was altered " +
      "(422 PLAN_NOT_VERIFIED) or you already keep the maximum (422 LIMIT_REACHED).",
  })
  @ApiDataResponse(SavedJourneySummaryDto, { status: 201 })
  @ApiErrorResponses(400, 422)
  save(
    @CurrentUser() user: AuthUser,
    @Body() dto: SaveJourneyDto,
  ): Promise<SavedJourneySummaryDto> {
    return this.journeys.save(user, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "One of your saved journeys, as it was saved" })
  @ApiDataResponse(SavedJourneyDto)
  @ApiErrorResponses(400, 404)
  get(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<SavedJourneyDto> {
    return this.journeys.get(user, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete one of your saved journeys" })
  @ApiErrorResponses(400, 404)
  remove(@CurrentUser() user: AuthUser, @Param("id", ParseUuidPipe) id: string): Promise<void> {
    return this.journeys.remove(user, id);
  }
}
