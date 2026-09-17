import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from "@nestjs/common";
import { ApiHeader, ApiNoContentResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { CookieOptions, Request, Response } from "express";
import { ApiDataResponse, ApiErrorResponses } from "../common/docs/api-responses.js";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { requestMeta } from "../common/http/app-request.js";
import { AppConfigService } from "../config/app-config.service.js";
import {
  CLIENT_PLATFORM_HEADER,
  NATIVE_CLIENT_PLATFORM,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
} from "./auth.constants.js";
import { type AuthResult, AuthService } from "./auth.service.js";
import { AuthRateLimit } from "./decorators/auth-rate-limit.decorator.js";
import { Public } from "./decorators/public.decorator.js";
import { AuthResponseDto } from "./dto/auth-response.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { RefreshTokenDto } from "./dto/refresh-token.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

const platformHeaderDoc = ApiHeader({
  name: "X-Client-Platform",
  required: false,
  description: "Send `native` from mobile apps to receive the refresh token in the body.",
});

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Post("register")
  @Public()
  @AuthRateLimit()
  @ApiOperation({ summary: "Create a rider account and sign in" })
  @platformHeaderDoc
  @ApiDataResponse(AuthResponseDto, { status: 201 })
  @ApiErrorResponses(400, 409, 429)
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.deliver(request, response, await this.auth.register(dto, requestMeta(request)));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Public()
  @AuthRateLimit()
  @ApiOperation({ summary: "Sign in with email and password" })
  @platformHeaderDoc
  @ApiDataResponse(AuthResponseDto)
  @ApiErrorResponses(400, 401, 403, 429)
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    return this.deliver(request, response, await this.auth.login(dto, requestMeta(request)));
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Public()
  @AuthRateLimit()
  @ApiOperation({ summary: "Rotate the refresh token and issue a new access token" })
  @platformHeaderDoc
  @ApiDataResponse(AuthResponseDto)
  @ApiErrorResponses(401, 403, 429)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const token = this.readRefreshToken(request, dto);
    if (!token) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.INVALID_REFRESH_TOKEN,
        "The session is invalid or has expired. Please sign in again.",
      );
    }
    try {
      return this.deliver(request, response, await this.auth.refresh(token, requestMeta(request)));
    } catch (error) {
      if (!dto.refreshToken) response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  @ApiOperation({ summary: "End the current session (idempotent)" })
  @ApiNoContentResponse({ description: "Session ended; refresh cookie cleared" })
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = this.readRefreshToken(request, dto);
    if (token) await this.auth.logout(token);
    response.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  /** Web clients get the refresh token as an httpOnly cookie; native clients in the body. */
  private deliver(request: Request, response: Response, result: AuthResult): AuthResponseDto {
    const body: AuthResponseDto = {
      user: result.user,
      accessToken: result.accessToken,
      tokenType: "Bearer",
      expiresIn: result.expiresIn,
    };

    if (isNativeClient(request)) {
      body.refreshToken = result.refreshToken;
      body.refreshTokenExpiresAt = result.refreshTokenExpiresAt;
    } else {
      response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
        ...this.cookieOptions(),
        expires: result.refreshTokenExpiresAt,
      });
    }
    return body;
  }

  /**
   * Body token (native) takes precedence. A cookie is only honoured when the
   * request's Origin, if any, is an allowed web origin — defence in depth against
   * cross-site requests when SameSite=None is configured.
   */
  private readRefreshToken(request: Request, dto: RefreshTokenDto): string | null {
    if (dto.refreshToken) return dto.refreshToken;

    const cookies = request.cookies as Record<string, unknown> | undefined;
    const cookie = cookies?.[REFRESH_COOKIE_NAME];
    if (typeof cookie !== "string" || cookie.length === 0) return null;

    const origin = request.get("origin");
    if (origin && !this.config.app.corsOrigins.includes(origin)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        "This origin is not allowed.",
      );
    }
    return cookie;
  }

  private cookieOptions(): CookieOptions {
    const { domain, sameSite, secure } = this.config.auth.cookie;
    return {
      httpOnly: true,
      secure,
      sameSite,
      path: REFRESH_COOKIE_PATH,
      ...(domain ? { domain } : {}),
    };
  }
}

function isNativeClient(request: Request): boolean {
  return request.get(CLIENT_PLATFORM_HEADER)?.toLowerCase() === NATIVE_CLIENT_PLATFORM;
}
