import { ApiProperty } from "@nestjs/swagger";
import { ImageDto } from "../../catalog/dto/catalog-response.dto.js";
import { ContentStatus } from "../../generated/prisma/enums.js";

// ─── Founders ────────────────────────────────────────────────────────────────

export class FounderDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  role!: string | null;

  @ApiProperty({ type: String, nullable: true })
  shortBio!: string | null;

  @ApiProperty({ type: String, nullable: true })
  story!: string | null;

  @ApiProperty({ type: String, nullable: true })
  quote!: string | null;

  @ApiProperty({ type: String, nullable: true })
  instagramUrl!: string | null;

  @ApiProperty({ type: String, nullable: true })
  linkedinUrl!: string | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  image!: ImageDto | null;

  @ApiProperty()
  sortOrder!: number;
}

export class AdminFounderDto extends FounderDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  createdById!: string | null;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  updatedById!: string | null;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export class StoryDestinationDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;
}

export class StorySummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, nullable: true })
  excerpt!: string | null;

  @ApiProperty({ type: String, nullable: true })
  authorName!: string | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  cover!: ImageDto | null;

  @ApiProperty({
    type: StoryDestinationDto,
    nullable: true,
    description: "Only when the destination is published",
  })
  destination!: StoryDestinationDto | null;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ description: "Estimated from the content at 200 words a minute" })
  readMinutes!: number;
}

export class StoryDetailDto extends StorySummaryDto {
  @ApiProperty({ type: String, nullable: true })
  content!: string | null;
}

export class AdminStoryDto extends StoryDetailDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "uuid", nullable: true })
  destinationId!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

// ─── Rider spotlights ────────────────────────────────────────────────────────

export class RiderSpotlightDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  bike!: string | null;

  @ApiProperty({ type: String, nullable: true })
  location!: string | null;

  @ApiProperty({ type: String, nullable: true })
  favouriteRide!: string | null;

  @ApiProperty({ type: String, nullable: true })
  shortStory!: string | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  image!: ImageDto | null;

  @ApiProperty()
  sortOrder!: number;
}

export class AdminRiderSpotlightDto extends RiderSpotlightDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export class GroupDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, nullable: true })
  region!: string | null;

  @ApiProperty({ type: String, nullable: true })
  rideCadence!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: "Null when not known" })
  memberCount!: number | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  cover!: ImageDto | null;

  @ApiProperty()
  sortOrder!: number;
}

export class AdminGroupDto extends GroupDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
