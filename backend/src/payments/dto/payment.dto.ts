import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";
import { ImageDto } from "../../catalog/dto/catalog-response.dto.js";
import { trimToNull } from "../../common/validation/transforms.js";
import {
  PaymentProvider,
  PaymentStatus,
  RideRegistrationStatus,
} from "../../generated/prisma/enums.js";

/** A UPI address (VPA) such as `36spokes@okhdfcbank`: a handle, "@", then the provider. */
export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;

// ─── Responses ─────────────────────────────────────────────────────────────

/** What a rider needs in order to pay by UPI. Nothing here is a credential. */
export class PaymentInfoDto {
  @ApiProperty({ description: "False until an admin has entered a UPI ID" })
  configured!: boolean;

  @ApiProperty({ type: String, nullable: true, example: "36spokes@okhdfcbank" })
  upiId!: string | null;

  @ApiProperty({ type: String, nullable: true, description: "Name shown in the rider's UPI app" })
  payeeName!: string | null;

  @ApiProperty({ type: String, nullable: true })
  instructions!: string | null;

  @ApiProperty({ type: ImageDto, nullable: true })
  qr!: ImageDto | null;

  @ApiProperty({ description: "Minutes a seat is held while the rider pays" })
  holdMinutes!: number;
}

export class AdminPaymentSettingsDto extends PaymentInfoDto {
  @ApiProperty({ type: String, format: "date-time", nullable: true })
  updatedAt!: Date | null;
}

export class AdminPaymentRiderDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: String, nullable: true })
  phone!: string | null;
}

export class AdminPaymentRideDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: String, format: "date-time" })
  startsAt!: Date;
}

/** One payment proof and the booking it pays for, for the crew to review. */
export class AdminPaymentDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ enum: PaymentProvider, enumName: "PaymentProvider" })
  provider!: PaymentProvider;

  @ApiProperty({ enum: PaymentStatus, enumName: "PaymentStatus" })
  status!: PaymentStatus;

  @ApiProperty({ description: "Paise, taken from the booking" })
  amount!: number;

  @ApiProperty({ example: "INR" })
  currency!: string;

  @ApiProperty({ example: "36S-000042" })
  reference!: string;

  @ApiProperty({ enum: RideRegistrationStatus, enumName: "RideRegistrationStatus" })
  bookingStatus!: RideRegistrationStatus;

  @ApiProperty({ type: AdminPaymentRiderDto })
  rider!: AdminPaymentRiderDto;

  @ApiProperty({ type: AdminPaymentRideDto })
  ride!: AdminPaymentRideDto;

  @ApiProperty({ type: String, nullable: true, description: "The uploaded screenshot" })
  proofUrl!: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  submittedAt!: Date;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  reviewedAt!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  rejectionReason!: string | null;
}

// ─── Inputs ────────────────────────────────────────────────────────────────

export class UpdatePaymentSettingsDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: "36spokes@okhdfcbank" })
  @Transform(trimToNull)
  @IsOptional()
  @Matches(UPI_ID_PATTERN, { message: "upiId must look like name@bank" })
  upiId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 80 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  payeeName?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 1000 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string | null;

  @ApiPropertyOptional({
    type: String,
    format: "uuid",
    nullable: true,
    description: "A SITE image uploaded through POST /media/uploads",
  })
  @IsOptional()
  @IsUUID()
  qrMediaId?: string | null;
}

export class SubmitPaymentProofDto {
  @ApiProperty({
    format: "uuid",
    description: "Your own PAYMENT_PROOF image, uploaded through POST /media/uploads",
  })
  @IsUUID()
  mediaAssetId!: string;
}

export class RejectPaymentDto {
  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 300 })
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string | null;
}

export const ADMIN_PAYMENT_FILTERS = ["pending", "reviewed", "all"] as const;
export type AdminPaymentFilter = (typeof ADMIN_PAYMENT_FILTERS)[number];

export class AdminPaymentListQueryDto {
  @ApiPropertyOptional({ enum: ADMIN_PAYMENT_FILTERS, default: "pending" })
  @IsOptional()
  @IsIn(ADMIN_PAYMENT_FILTERS)
  status?: AdminPaymentFilter;
}
