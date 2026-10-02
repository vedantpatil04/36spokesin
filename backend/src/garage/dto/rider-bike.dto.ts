import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { BikeModelDto } from "../../bikes/dto/bike-response.dto.js";
import { trimToNull } from "../../common/validation/transforms.js";

export const MAX_BIKES_PER_RIDER = 20;
export const EARLIEST_MODEL_YEAR = 1950;

export class CreateRiderBikeDto {
  @ApiProperty({ format: "uuid", description: "A bike model from GET /bikes" })
  @IsUUID()
  bikeModelId!: string;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  bikeVariantId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 40, example: "The Kaza mule" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nickname?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: EARLIEST_MODEL_YEAR })
  @IsOptional()
  @IsInt()
  @Min(EARLIEST_MODEL_YEAR)
  @Max(2100)
  year?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0, maximum: 2_000_000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  odometerKm?: number | null;

  @ApiPropertyOptional({ description: "Make this your main bike. Your first bike always is." })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateRiderBikeDto extends PartialType(CreateRiderBikeDto) {}

export class RiderBikeDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ type: BikeModelDto })
  bike!: BikeModelDto;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  bikeVariantId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  bikeVariantName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  nickname!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  year!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  odometerKm!: number | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty({ description: "The model has since been archived from the catalogue" })
  archived!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
