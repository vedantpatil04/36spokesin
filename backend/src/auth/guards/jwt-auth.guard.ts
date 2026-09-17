import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { AppRequest } from "../../common/http/app-request.js";
import { IS_PUBLIC_KEY } from "../auth.constants.js";
import { TokenService } from "../token.service.js";

/**
 * Global guard: every route requires a valid access token unless marked @Public().
 * Verification is stateless (signature, expiry, issuer, audience); no database hit.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AppRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "Authentication required.",
      );
    }

    const user = await this.tokens.verifyAccessToken(token);
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "The access token is invalid or has expired.",
      );
    }

    request.user = user;
    return true;
  }
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token, ...rest] = header.split(" ");
  if (rest.length > 0 || scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}
