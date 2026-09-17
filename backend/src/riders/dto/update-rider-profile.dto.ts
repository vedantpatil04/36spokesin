import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { trimToNull } from "../../common/validation/transforms.js";

export class UpdateRiderProfileDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 60 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 100, example: "Pune" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "A READY media asset of category RIDER that you uploaded. null removes the photo.",
  })
  @IsOptional()
  @IsUUID()
  avatarMediaId?: string | null;
}
