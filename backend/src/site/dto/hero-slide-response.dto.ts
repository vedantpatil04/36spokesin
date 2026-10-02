import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentStatus, HeroAutoAdvanceMode, HeroMediaType } from "../../generated/prisma/enums.js";

export class HeroSlideDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  eyebrow!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  location!: string | null;

  @ApiProperty({ enum: HeroMediaType, enumName: "HeroMediaType", default: HeroMediaType.IMAGE })
  mediaType!: HeroMediaType;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  videoUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  posterUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  mobileUrl!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  imageMediaId!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  videoMediaId!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  posterMediaId!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  mobileMediaId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ctaLabel!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  ctaUrl!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  secondaryCtaLabel!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  secondaryCtaUrl!: string | null;

  @ApiProperty({ example: 5, default: 5 })
  durationSeconds!: number;

  @ApiProperty({
    enum: HeroAutoAdvanceMode,
    enumName: "HeroAutoAdvanceMode",
    default: HeroAutoAdvanceMode.FIXED_DURATION,
  })
  autoAdvanceMode!: HeroAutoAdvanceMode;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
