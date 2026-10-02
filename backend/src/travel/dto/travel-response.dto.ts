import { ApiProperty } from "@nestjs/swagger";
import { CatalogRefDto, ProductImageDto } from "../../catalog/dto/catalog-response.dto.js";
import { ContentStatus, DepartureStatus, Difficulty } from "../../generated/prisma/enums.js";

/** A ride linked to a destination or trip (see RidesModule for the full shape). */
export class RideRefDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, format: "date-time" })
  startsAt!: Date;
}

export class DestinationSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  shortDescription!: string | null;

  @ApiProperty()
  region!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty({ enum: Difficulty, enumName: "Difficulty" })
  difficulty!: Difficulty;

  @ApiProperty({ type: String, nullable: true })
  bestSeason!: string | null;

  @ApiProperty({ type: String, nullable: true })
  durationRecommendation!: string | null;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({ type: ProductImageDto, nullable: true })
  primaryImage!: ProductImageDto | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Lowest price (paise) among open, upcoming departures of its published trips",
  })
  startingPrice!: number | null;

  @ApiProperty({ description: "Published trips" })
  tripCount!: number;
}

export class DestinationDetailDto extends DestinationSummaryDto {
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, nullable: true })
  usefulInfo!: string | null;

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];

  @ApiProperty({ type: [RideRefDto], description: "Upcoming public rides linked to it" })
  rides!: RideRefDto[];
}

export class AdminDestinationDto extends DestinationDetailDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class TripDepartureDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "2026-10-05" })
  startDate!: string;

  @ApiProperty({ example: "2026-10-12" })
  endDate!: string;

  @ApiProperty({ type: Number, nullable: true, description: "Paise per rider; null = on request" })
  price!: number | null;

  @ApiProperty()
  capacity!: number;

  @ApiProperty({ enum: DepartureStatus, enumName: "DepartureStatus" })
  status!: DepartureStatus;
}

export class ItineraryDayDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  dayNumber!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, nullable: true })
  routeSummary!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  distanceKm!: number | null;

  @ApiProperty({ type: String, nullable: true })
  accommodation!: string | null;

  @ApiProperty({ type: String, nullable: true })
  notes!: string | null;
}

export class TripSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: String, nullable: true })
  shortDescription!: string | null;

  @ApiProperty({ type: CatalogRefDto })
  destination!: CatalogRefDto;

  @ApiProperty()
  durationDays!: number;

  @ApiProperty({ type: Number, nullable: true })
  distanceKm!: number | null;

  @ApiProperty({ enum: Difficulty, enumName: "Difficulty" })
  difficulty!: Difficulty;

  @ApiProperty()
  startingLocation!: string;

  @ApiProperty({ type: String, nullable: true })
  endingLocation!: string | null;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({ type: ProductImageDto, nullable: true })
  primaryImage!: ProductImageDto | null;

  @ApiProperty({
    type: [TripDepartureDto],
    description: "Public: upcoming, not cancelled; by date",
  })
  departures!: TripDepartureDto[];
}

export class TripDetailDto extends TripSummaryDto {
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: [ItineraryDayDto] })
  itinerary!: ItineraryDayDto[];

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];

  @ApiProperty({ type: [RideRefDto] })
  rides!: RideRefDto[];
}

export class AdminTripDto extends TripDetailDto {
  @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
  status!: ContentStatus;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}
