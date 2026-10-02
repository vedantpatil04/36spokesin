import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { CatalogRefDto, ProductImageDto } from "../../catalog/dto/catalog-response.dto.js";
import { MAX_PRICE_MINOR } from "../../catalog/dto/product-input.dto.js";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, normaliseSlug } from "../../common/validation/slug.js";
import {
  PHONE_PATTERN,
  normalisePhone,
  trim,
  trimToNull,
} from "../../common/validation/transforms.js";
import { RidePaymentStatus } from "../ride-booking.mapper.js";
import {
  Difficulty,
  RideRegistrationStatus,
  RideStatus,
  RideType,
} from "../../generated/prisma/enums.js";

// ─── Responses ─────────────────────────────────────────────────────────────

export class RideSummaryDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, nullable: true })
  shortDescription!: string | null;

  @ApiProperty({ enum: RideType, enumName: "RideType" })
  type!: RideType;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  meetingPoint!: string;

  @ApiProperty({ type: String, format: "date-time" })
  startsAt!: Date;

  @ApiProperty({ type: String, nullable: true, example: "5 hrs" })
  durationLabel!: string | null;

  @ApiProperty({ type: String, nullable: true })
  routeStart!: string | null;

  @ApiProperty({ type: String, nullable: true })
  routeFinish!: string | null;

  @ApiProperty({ type: [String] })
  waypoints!: string[];

  @ApiProperty({ type: String, nullable: true })
  routeSummary!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  distanceKm!: number | null;

  @ApiProperty({ enum: Difficulty, enumName: "Difficulty" })
  difficulty!: Difficulty;

  @ApiProperty({ type: String, nullable: true })
  rideLeader!: string | null;

  @ApiProperty()
  capacity!: number;

  @ApiProperty({ type: Number, nullable: true, description: "Paise per rider; null = free" })
  price!: number | null;

  @ApiProperty({ description: "Riders currently registered" })
  registeredCount!: number;

  @ApiProperty()
  spotsLeft!: number;

  @ApiProperty({ description: "UPCOMING, not started and not full" })
  registrationOpen!: boolean;

  @ApiProperty({ enum: RideStatus, enumName: "RideStatus" })
  status!: RideStatus;

  @ApiProperty()
  featured!: boolean;

  @ApiProperty({ type: ProductImageDto, nullable: true })
  primaryImage!: ProductImageDto | null;

  @ApiProperty({ type: CatalogRefDto, nullable: true })
  destination!: CatalogRefDto | null;

  @ApiProperty({ type: CatalogRefDto, nullable: true })
  trip!: CatalogRefDto | null;
}

export class RideDetailDto extends RideSummaryDto {
  @ApiProperty({ type: String, nullable: true })
  description!: string | null;

  @ApiProperty({ type: [ProductImageDto] })
  images!: ProductImageDto[];
}

export class AdminRideDto extends RideDetailDto {
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class RideRegistrationDto {
  @ApiProperty({ format: "uuid" })
  rideId!: string;

  @ApiProperty({ description: "Currently registered" })
  registered!: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Booking number; null before a booking",
  })
  number!: number | null;

  @ApiProperty({ type: String, nullable: true, example: "36S-000042" })
  reference!: string | null;

  @ApiProperty({ type: String, nullable: true })
  contactPhone!: string | null;

  @ApiProperty({ type: String, nullable: true, example: "Royal Enfield Himalayan 450 (2024)" })
  bikeLabel!: string | null;

  @ApiProperty({ type: String, nullable: true })
  note!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Price per rider (paise) quoted when booking; null = free. Not a payment.",
  })
  amount!: number | null;

  @ApiProperty({ type: String, nullable: true, example: "INR" })
  currency!: string | null;

  @ApiProperty({ enum: RideRegistrationStatus, enumName: "RideRegistrationStatus", nullable: true })
  status!: RideRegistrationStatus | null;

  @ApiProperty({
    enum: RidePaymentStatus,
    enumName: "RidePaymentStatus",
    nullable: true,
    description: "Derived on the server from the booking and its latest payment",
  })
  paymentStatus!: RidePaymentStatus | null;

  @ApiProperty({
    type: String,
    format: "date-time",
    nullable: true,
    description: "While PENDING_PAYMENT with no proof in: when the held seat is released",
  })
  holdExpiresAt!: Date | null;

  @ApiProperty({ description: "Cancelled because the seat hold ran out, not by the rider" })
  holdExpired!: boolean;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  paymentSubmittedAt!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  paymentRejectionReason!: string | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  registeredAt!: Date | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  cancelledAt!: Date | null;
}

export class MyRideDto {
  @ApiProperty({ type: RideSummaryDto })
  ride!: RideSummaryDto;

  @ApiProperty()
  bookingNumber!: number;

  @ApiProperty({ example: "36S-000042" })
  reference!: string;

  @ApiProperty({
    enum: RideRegistrationStatus,
    enumName: "RideRegistrationStatus",
    description:
      "REGISTERED is confirmed, PENDING_PAYMENT holds a seat until paid, CANCELLED is history",
  })
  status!: RideRegistrationStatus;

  @ApiProperty({ enum: RidePaymentStatus, enumName: "RidePaymentStatus" })
  paymentStatus!: RidePaymentStatus;

  @ApiProperty({ type: String, format: "date-time" })
  registeredAt!: Date;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  cancelledAt!: Date | null;
}

/** One booking on a ride, as the crew sees it. Each booking is one rider, one seat. */
export class AdminRideBookingDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "36S-000042" })
  reference!: string;

  @ApiProperty({ enum: RideRegistrationStatus, enumName: "RideRegistrationStatus" })
  status!: RideRegistrationStatus;

  @ApiProperty({ enum: RidePaymentStatus, enumName: "RidePaymentStatus" })
  paymentStatus!: RidePaymentStatus;

  @ApiProperty({ description: "Seats this booking holds: 1 while confirmed or held, else 0" })
  seats!: number;

  @ApiProperty()
  riderName!: string;

  @ApiProperty()
  riderEmail!: string;

  @ApiProperty({ type: String, nullable: true })
  contactPhone!: string | null;

  @ApiProperty({ type: String, nullable: true })
  bikeLabel!: string | null;

  @ApiProperty({ type: String, nullable: true })
  note!: string | null;

  @ApiProperty({ type: Number, nullable: true, description: "Paise quoted; not a payment" })
  amount!: number | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  cancelledAt!: Date | null;
}

// ─── Inputs ────────────────────────────────────────────────────────────────

export class CreateRideDto {
  @ApiProperty({ maxLength: 160, example: "Sunrise run to Tamhini Ghat" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: "Generated from the title when omitted" })
  @Transform(normaliseSlug)
  @IsOptional()
  @MaxLength(SLUG_MAX_LENGTH)
  @Matches(SLUG_PATTERN, { message: "slug must be lower-case words separated by hyphens" })
  slug?: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 20000 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiProperty({ enum: RideType, enumName: "RideType" })
  @IsEnum(RideType)
  type!: RideType;

  @ApiProperty({ maxLength: 120, example: "Pune" })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  location!: string;

  @ApiProperty({ maxLength: 300 })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  meetingPoint!: string;

  @ApiProperty({ example: "2026-10-04T06:00:00+05:30", description: "ISO 8601 with offset" })
  @IsISO8601({ strict: true })
  startsAt!: string;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 40 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  durationLabel?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  routeStart?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  routeFinish?: string | null;

  @ApiPropertyOptional({ type: [String], maxItems: 20 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(120, { each: true })
  waypoints?: string[];

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  routeSummary?: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  distanceKm?: number | null;

  @ApiProperty({ enum: Difficulty, enumName: "Difficulty" })
  @IsEnum(Difficulty)
  difficulty!: Difficulty;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 120 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  rideLeader?: string | null;

  @ApiProperty({ minimum: 1, maximum: 500 })
  @IsInt()
  @Min(1)
  @Max(500)
  capacity!: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: "Paise per rider. Omit or null for a free ride.",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE_MINOR)
  price?: number | null;

  @ApiPropertyOptional({ enum: RideStatus, enumName: "RideStatus", default: "DRAFT" })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  destinationId?: string | null;

  @ApiPropertyOptional({ type: String, format: "uuid", nullable: true })
  @IsOptional()
  @IsUUID()
  tripId?: string | null;
}

export class UpdateRideDto extends PartialType(CreateRideDto) {}

/** What a rider sends to book a ride. Name and email come from the signed-in account. */
export class BookRideDto {
  @ApiProperty({ example: "+919876543210", description: "Where the ride crew can reach you" })
  @Transform(normalisePhone)
  @IsString({ message: "contactPhone is required" })
  @Matches(PHONE_PATTERN, {
    message: "contactPhone must be an international number, e.g. +919876543210",
  })
  contactPhone!: string;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "One of your own bikes from GET /my-bikes",
  })
  @IsOptional()
  @IsUUID()
  riderBikeId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 500 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

export class RideListQueryDto {
  @ApiPropertyOptional({ enum: ["upcoming", "past"], default: "upcoming" })
  @IsOptional()
  @IsIn(["upcoming", "past"])
  when?: "upcoming" | "past";

  @ApiPropertyOptional({ enum: RideType, enumName: "RideType" })
  @IsOptional()
  @IsEnum(RideType)
  type?: RideType;

  @ApiPropertyOptional({ description: "Destination slug" })
  @IsOptional()
  @Matches(SLUG_PATTERN)
  destination?: string;
}

export class AdminRideListQueryDto {
  @ApiPropertyOptional({ enum: RideStatus, enumName: "RideStatus" })
  @IsOptional()
  @IsEnum(RideStatus)
  status?: RideStatus;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @MaxLength(100)
  q?: string | null;
}
