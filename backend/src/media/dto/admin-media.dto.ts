import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { CursorPaginationQueryDto } from "../../common/pagination/cursor-pagination.dto.js";
import { queryBoolean } from "../../common/validation/query.js";
import { MediaCategory } from "../../generated/prisma/enums.js";
import { MediaAssetResponseDto } from "./media-asset-response.dto.js";

export class AdminMediaQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    enum: MediaCategory,
    enumName: "MediaCategory",
    description: "Defaults to catalogue media (PRODUCT and BIKE).",
  })
  @IsOptional()
  @IsEnum(MediaCategory)
  category?: MediaCategory;

  @ApiPropertyOptional({ description: "Only assets nothing references" })
  @IsOptional()
  @Transform(queryBoolean)
  @IsBoolean()
  unused?: boolean;
}

export class MediaUsageDto {
  @ApiProperty({ description: "Number of records using the asset" })
  total!: number;

  @ApiProperty({ example: "Used as 2 product images." })
  summary!: string;

  @ApiProperty({ type: "object", additionalProperties: { type: "integer" } })
  counts!: Record<string, number>;
}

export class AdminMediaAssetDto extends MediaAssetResponseDto {
  @ApiProperty({ type: MediaUsageDto })
  usage!: MediaUsageDto;
}
