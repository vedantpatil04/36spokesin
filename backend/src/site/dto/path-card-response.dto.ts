import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ContentStatus } from "../../generated/prisma/enums.js";

export class PathCardDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "rides" })
  slug!: string;

  @ApiProperty({ example: "Rides" })
  title!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  tagline!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ example: "Find a ride" })
  ctaLabel!: string;

  @ApiProperty({ example: "/rides" })
  destinationUrl!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  badge!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  imageMediaId!: string | null;

  @ApiProperty({ example: 0 })
  sortOrder!: number;

  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
