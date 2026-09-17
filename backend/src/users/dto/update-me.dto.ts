import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from "class-validator";
import {
  PHONE_PATTERN,
  normalisePhone,
  trim,
  trimToNull,
} from "../../common/validation/transforms.js";

export class UpdateMeDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100 })
  @Transform(trim)
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: "+919876543210" })
  @Transform(normalisePhone)
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: "phone must be an international number, e.g. +919876543210" })
  phone?: string | null;
}
