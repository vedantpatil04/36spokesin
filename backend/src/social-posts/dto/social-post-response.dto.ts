import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SocialMediaType, SocialPlatform, SocialPostStatus } from "../../generated/prisma/enums.js";

export class SocialPostSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "https://www.instagram.com/p/C_sample1/" })
  postUrl!: string;

  @ApiProperty({ enum: SocialMediaType, enumName: "SocialMediaType", default: SocialMediaType.IMAGE })
  mediaType!: SocialMediaType;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  videoUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  caption!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  username!: string | null;

  @ApiProperty({ enum: SocialPlatform, enumName: "SocialPlatform" })
  platform!: SocialPlatform;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ example: false })
  isFeatured!: boolean;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;
}


export class AdminSocialPostDto extends SocialPostSummaryDto {
  @ApiProperty({ enum: SocialPostStatus, enumName: "SocialPostStatus" })
  status!: SocialPostStatus;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  mediaAssetId!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  createdById!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  updatedById!: string | null;
}
