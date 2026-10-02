import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { AdminPaymentsController, PaymentsController } from "./payments.controller.js";
import { PaymentsService } from "./payments.service.js";

/** Payment details, payment proofs for ride bookings and their admin review. */
@Module({
  imports: [MediaModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
