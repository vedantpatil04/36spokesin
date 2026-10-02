import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional, Matches } from "class-validator";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { SLUG_PATTERN } from "../common/validation/slug.js";
import { BikesService } from "./bikes.service.js";
import { BikeModelDto } from "./dto/bike-response.dto.js";

export class BikeListQueryDto {
  @ApiPropertyOptional({ description: "Brand slug", example: "royal-enfield" })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  brand?: string;
}

@ApiTags("bikes")
@Public()
@Controller("bikes")
export class BikesController {
  constructor(private readonly bikes: BikesService) {}

  @Get()
  @ApiOperation({ summary: "List motorcycles in the catalogue" })
  @ApiDataResponse(BikeModelDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: BikeListQueryDto): Promise<BikeModelDto[]> {
    return this.bikes.listActive(query.brand);
  }

  @Get(":idOrSlug")
  @ApiOperation({ summary: "Get a motorcycle by id or slug" })
  @ApiDataResponse(BikeModelDto)
  @ApiErrorResponses(404)
  get(@Param("idOrSlug") idOrSlug: string): Promise<BikeModelDto> {
    return this.bikes.getActive(idOrSlug);
  }
}
