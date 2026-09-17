import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AppConfigService } from "../config/app-config.service.js";
import { JWT_AUDIENCE, JWT_ISSUER } from "./auth.constants.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./guards/jwt-auth.guard.js";
import { RolesGuard } from "./guards/roles.guard.js";
import { PasswordService } from "./password.service.js";
import { SessionsService } from "./sessions.service.js";
import { TokenService } from "./token.service.js";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.auth.jwtSecret,
        signOptions: {
          algorithm: "HS256",
          expiresIn: config.auth.accessTokenTtlSeconds,
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
        verifyOptions: { algorithms: ["HS256"], issuer: JWT_ISSUER, audience: JWT_AUDIENCE },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    SessionsService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [PasswordService, TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
