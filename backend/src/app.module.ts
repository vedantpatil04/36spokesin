import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AUTH_RATE_LIMIT_KEY } from "./auth/auth.constants.js";
import { AuthModule } from "./auth/auth.module.js";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard.js";
import { RolesGuard } from "./auth/guards/roles.guard.js";
import { AllExceptionsFilter } from "./common/errors/all-exceptions.filter.js";
import { ResponseEnvelopeInterceptor } from "./common/http/response-envelope.interceptor.js";
import { createValidationPipe } from "./common/validation/validation.js";
import { AppConfigModule } from "./config/app-config.module.js";
import { AppConfigService } from "./config/app-config.service.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { createLoggerOptions } from "./logging/logger.options.js";
import { MediaModule } from "./media/media.module.js";
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
            limit: (context) =>
              Reflect.getMetadata(AUTH_RATE_LIMIT_KEY, context.getHandler()) === true
                ? config.rateLimit.authMax
                : config.rateLimit.max,
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
