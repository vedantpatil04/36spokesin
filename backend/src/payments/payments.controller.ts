import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AuthUser } from "../auth/auth-user.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ParseUuidPipe } from "../common/validation/validation.js";
import { UserRole } from "../generated/prisma/enums.js";
import { RideRegistrationDto } from "../rides/dto/ride.dto.js";
import {
  AdminPaymentDto,
  AdminPaymentListQueryDto,
  AdminPaymentSettingsDto,
  PaymentInfoDto,
  RejectPaymentDto,
  SubmitPaymentProofDto,
  UpdatePaymentSettingsDto,
} from "./dto/payment.dto.js";
import { PaymentsService } from "./payments.service.js";

@ApiTags("payments")
@ApiBearerAuth()
@ApiErrorResponses(401)
@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("payment-info")
  @ApiOperation({ summary: "Where to pay for a paid ride: UPI ID, QR code and instructions" })
  @ApiDataResponse(PaymentInfoDto)
  info(): Promise<PaymentInfoDto> {
    return this.payments.info();
  }

  @Post("rides/:id/payment-proof")
  @ApiOperation({
    summary: "Submit the screenshot of your UPI payment for your booking on a ride",
    description:
      "Upload the image first through POST /media/uploads with category PAYMENT_PROOF. The " +
      "amount is taken from the booking. Refused when there is no booking (404), it is " +
      "cancelled, already confirmed or already has a proof under review (409), or the image " +
      "isn't your own unused upload (422 MEDIA_NOT_USABLE). Only an admin's approval marks " +
      "the payment paid.",
  })
  @ApiDataResponse(RideRegistrationDto, { status: 201 })
  @ApiErrorResponses(400, 404, 409, 422)
  submitProof(
    @CurrentUser() user: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: SubmitPaymentProofDto,
  ): Promise<RideRegistrationDto> {
    return this.payments.submitRideProof(user, id, dto);
  }
}

@ApiTags("admin: payments")
@ApiBearerAuth()
@ApiErrorResponses(401, 403)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get("payment-settings")
  @ApiOperation({ summary: "The UPI details riders are shown (admin)" })
  @ApiDataResponse(AdminPaymentSettingsDto)
  settings(): Promise<AdminPaymentSettingsDto> {
    return this.payments.adminSettings();
  }

  @Patch("payment-settings")
  @ApiOperation({ summary: "Set the UPI ID, payee name, instructions and QR image (admin)" })
  @ApiDataResponse(AdminPaymentSettingsDto)
  @ApiErrorResponses(400, 422)
  updateSettings(
    @CurrentUser() admin: AuthUser,
    @Body() dto: UpdatePaymentSettingsDto,
  ): Promise<AdminPaymentSettingsDto> {
    return this.payments.updateSettings(admin, dto);
  }

  @Get("payments")
  @ApiOperation({ summary: "Payment proofs: awaiting review (default), reviewed or all (admin)" })
  @ApiDataResponse(AdminPaymentDto, { isArray: true })
  @ApiErrorResponses(400)
  list(@Query() query: AdminPaymentListQueryDto): Promise<AdminPaymentDto[]> {
    return this.payments.adminList(query);
  }

  @Post("payments/:id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify a payment: marks it PAID and confirms the booking (admin)" })
  @ApiDataResponse(AdminPaymentDto)
  @ApiErrorResponses(400, 404, 409)
  approve(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
  ): Promise<AdminPaymentDto> {
    return this.payments.approve(admin, id);
  }

  @Post("payments/:id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject a payment proof, with an optional reason (admin)" })
  @ApiDataResponse(AdminPaymentDto)
  @ApiErrorResponses(400, 404, 409)
  reject(
    @CurrentUser() admin: AuthUser,
    @Param("id", ParseUuidPipe) id: string,
    @Body() dto: RejectPaymentDto,
  ): Promise<AdminPaymentDto> {
    return this.payments.reject(admin, id, dto);
  }
}
