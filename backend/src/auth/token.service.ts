import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AppConfigService } from "../config/app-config.service.js";
import { UserRole } from "../generated/prisma/enums.js";
import type { AuthUser } from "./auth-user.js";

interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  sid: string;
}

const ROLES = new Set<string>(Object.values(UserRole));

/** Signs and verifies short-lived access tokens (HS256 JWT). */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.auth.accessTokenTtlSeconds;
  }

  signAccessToken(user: { id: string; role: UserRole }, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ role: user.role, sid: sessionId }, { subject: user.id });
  }

  /** Returns the principal, or null for any invalid, expired or malformed token. */
  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    try {
      const claims = await this.jwt.verifyAsync<Partial<AccessTokenClaims>>(token);
      if (
        typeof claims.sub !== "string" ||
        typeof claims.sid !== "string" ||
        typeof claims.role !== "string" ||
        !ROLES.has(claims.role)
      ) {
        return null;
      }
      return { id: claims.sub, role: claims.role, sessionId: claims.sid };
    } catch {
      return null;
    }
  }
}
