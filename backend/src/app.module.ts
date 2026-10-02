import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AUTH_RATE_LIMIT_KEY } from "./auth/auth.constants.js";
import { AuthModule } from "./auth/auth.module.js";
import { BikesModule } from "./bikes/bikes.module.js";
import { CatalogModule } from "./catalog/catalog.module.js";
import { CommerceModule } from "./commerce/commerce.module.js";
import { CommunityModule } from "./community/community.module.js";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "./auth/guards/roles.guard.js";
import { AllExceptionsFilter } from "./common/errors/all-exceptions.filter.js";
import { ResponseEnvelopeInterceptor } from "./common/http/response-envelope.interceptor.js";
import { createValidationPipe } from "./common/validation/validation.js";
import { AppConfigModule } from "./config/app-config.module.js";
import { AppConfigService } from "./config/app-config.service.js";
import { DatabaseModule } from "./database/database.module.js";
import { GalleriesModule } from "./galleries/galleries.module.js";
import { GarageModule } from "./garage/garage.module.js";
import { HealthModule } from "./health/health.module.js";
import { createLoggerOptions } from "./logging/logger.options.js";
import { MediaModule } from "./media/media.module.js";
import { PaymentsModule } from "./payments/payments.module.js";
import { PLAN_RATE_LIMIT_KEY } from "./plan/plan-rate-limit.decorator.js";
import { PlanModule } from "./plan/plan.module.js";
import { RidesModule } from "./rides/rides.module.js";
import { SiteModule } from "./site/site.module.js";
import { SocialPostsModule } from "./social-posts/social-posts.module.js";
import { TravelModule } from "./travel/travel.module.js";
import { RidersModule } from "./riders/riders.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: createLoggerOptions,
    }),
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      // In-memory storage suits a single instance. Running several API instances
      // needs a shared ThrottlerStorage (e.g. Redis); nothing else changes.
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          {
            name: "default",
            ttl: seconds(config.rateLimit.ttlSeconds),
            limit: (context) => {
              const handler = context.getHandler();
              if (Reflect.getMetadata(AUTH_RATE_LIMIT_KEY, handler) === true) {
                return config.rateLimit.authMax;
              }
              if (Reflect.getMetadata(PLAN_RATE_LIMIT_KEY, handler) === true) {
                return config.plan.rateLimitMax;
              }
              return config.rateLimit.max;
            },
          },
        ],
        skipIf: () => !config.rateLimit.enabled,
        errorMessage: "Too many requests. Please try again shortly.",
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RidersModule,
    MediaModule,
    CatalogModule,
    BikesModule,
    GarageModule,
    CommerceModule,
    GalleriesModule,
    TravelModule,
    RidesModule,
    PaymentsModule,
    PlanModule,
    SocialPostsModule,
    CommunityModule,
    SiteModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    // Guards run in this order: rate limit → authentication → roles.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: RolesGuard },
  ],
})
export class AppModule {}
