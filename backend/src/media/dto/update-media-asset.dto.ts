import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";
import { trimToNull } from "../../common/validation/transforms.js";

export class UpdateMediaAssetDto {
  @ApiProperty({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText!: string | null;
}
