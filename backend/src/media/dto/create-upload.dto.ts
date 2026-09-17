import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { trimToNull } from "../../common/validation/transforms.js";
import { MediaCategory } from "../../generated/prisma/enums.js";
import { ALLOWED_MEDIA_MIME_TYPES, type AllowedMediaMimeType } from "../media.policy.js";

export class CreateUploadDto {
  @ApiProperty({ example: "spiti-valley.jpg", maxLength: 255, description: "Display only" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ enum: ALLOWED_MEDIA_MIME_TYPES })
  @IsIn(ALLOWED_MEDIA_MIME_TYPES)
  mimeType!: AllowedMediaMimeType;

  @ApiProperty({ description: "Exact file size in bytes", minimum: 1, example: 482133 })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  fileSize!: number;

  @ApiProperty({ enum: MediaCategory, enumName: "MediaCategory" })
  @IsEnum(MediaCategory)
  category!: MediaCategory;

  @ApiPropertyOptional({
    type: String,
    maxLength: 300,
    example: "Rider on a gravel road above Kaza",
  })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string | null;
}
