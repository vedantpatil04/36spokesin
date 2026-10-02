import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from "class-validator";
import { trimToNull } from "../../common/validation/transforms.js";
import { SocialMediaType, SocialPlatform, SocialPostStatus } from "../../generated/prisma/enums.js";
import { IsInstagramPostUrl, normalizeInstagramUrl } from "../instagram-url.js";

export class CreateSocialPostDto {
  @ApiProperty({ example: "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==" })
  @Transform(({ value }) => (typeof value === "string" ? normalizeInstagramUrl(value) : value))
  @IsString()
  @IsInstagramPostUrl()
  @MaxLength(1000)
  postUrl!: string;

  @ApiPropertyOptional({ enum: SocialMediaType, enumName: "SocialMediaType", default: SocialMediaType.IMAGE })
  @IsOptional()
  @IsEnum(SocialMediaType)
  mediaType?: SocialMediaType;

  @ApiPropertyOptional({ enum: SocialPlatform, enumName: "SocialPlatform", default: SocialPlatform.INSTAGRAM })
  @IsOptional()
  @IsEnum(SocialPlatform)
  platform?: SocialPlatform;

  @ApiPropertyOptional({ example: "36spokes" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string | null;

  @ApiPropertyOptional({ example: "Through the valleys of Spiti on the Himalayan 450." })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  caption?: string | null;

  @ApiPropertyOptional({ example: "https://images.unsplash.com/photo-1558981806-ec527fa84c39" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: "imageUrl must be a valid URL with http or https" })
  @MaxLength(2000)
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: "https://storage.example.com/video.mp4" })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true }, { message: "videoUrl must be a valid URL with http or https" })
  @MaxLength(2000)
  videoUrl?: string | null;

  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  mediaAssetId?: string | null;

  @ApiPropertyOptional({ enum: SocialPostStatus, enumName: "SocialPostStatus", default: SocialPostStatus.DRAFT })
  @IsOptional()
  @IsEnum(SocialPostStatus)
  status?: SocialPostStatus;


  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class UpdateSocialPostDto extends PartialType(CreateSocialPostDto) {}

export class ReorderSocialPostsDto {
  @ApiProperty({
    type: [String],
    format: "uuid",
    description: "Every social post id in the desired order",
  })
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("all", { each: true })
  postIds!: string[];
}

export class AdminSocialPostQueryDto {
  @ApiPropertyOptional({ enum: SocialPostStatus, enumName: "SocialPostStatus" })
  @IsOptional()
  @IsEnum(SocialPostStatus)
  status?: SocialPostStatus;
}
