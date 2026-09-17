import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import type { Response } from "express";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiDataResponse } from "../common/docs/api-responses.js";
import { PrismaService } from "../database/prisma.service.js";
import { MediaService } from "../media/media.service.js";

class HealthChecksDto {
  @ApiProperty({ enum: ["up", "down"] })
  database!: "up" | "down";

  @ApiProperty({ enum: ["configured", "not_configured"] })
  storage!: "configured" | "not_configured";
}

export class HealthResponseDto {
  @ApiProperty({ enum: ["ok", "degraded"] })
  status!: "ok" | "degraded";

  @ApiProperty({ example: 1234 })
  uptimeSeconds!: number;

  @ApiProperty({ type: String, format: "date-time" })
  timestamp!: string;

  @ApiProperty({ type: HealthChecksDto })
  checks!: HealthChecksDto;
}

export class LivenessResponseDto {
  @ApiProperty({ enum: ["ok"] })
  status!: "ok";
}

@ApiTags("health")
@Public()
@SkipThrottle()
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Readiness: API plus database connectivity. 503 when the database is down.",
  })
  @ApiDataResponse(HealthResponseDto)
  @ApiDataResponse(HealthResponseDto, { status: 503, description: "Database unreachable" })
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthResponseDto> {
    const databaseUp = await this.prisma.isHealthy();
    if (!databaseUp) response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: databaseUp ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseUp ? "up" : "down",
        storage: this.media.storageConfigured ? "configured" : "not_configured",
      },
    };
  }

  @Get("live")
  @ApiOperation({ summary: "Liveness: the process is serving requests. No dependency checks." })
  @ApiDataResponse(LivenessResponseDto)
  live(): LivenessResponseDto {
    return { status: "ok" };
  }
}
