import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { createHmac, randomBytes } from "node:crypto";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import type { RequestMeta } from "../common/http/app-request.js";
import { AppConfigService } from "../config/app-config.service.js";
import { PrismaService } from "../database/prisma.service.js";
import { type PublicUser, userPublicSelect } from "../users/user.mapper.js";
import { REFRESH_REUSE_GRACE_MS } from "./auth.constants.js";

export interface IssuedRefreshToken {
  sessionId: string;
  token: string;
  expiresAt: Date;
}

export interface RotatedSession extends IssuedRefreshToken {
  user: PublicUser;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Refresh-token sessions. Tokens are 256-bit random values; the database stores
 * only HMAC-SHA256 digests keyed by JWT_REFRESH_SECRET, so a database leak alone
 * cannot be replayed. Every refresh rotates the token.
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async create(userId: string, meta: RequestMeta): Promise<IssuedRefreshToken> {
    const token = this.generateToken();
    const expiresAt = this.nextExpiry();
    const session = await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash: this.digest(token),
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
      select: { id: true },
    });
    return { sessionId: session.id, token, expiresAt };
  }

  /**
   * Exchanges a valid refresh token for a new one. Rejects expired, revoked and
   * unknown tokens, and revokes the whole session if an already-rotated token is
   * replayed outside the grace window.
   */
  async rotate(token: string, meta: RequestMeta): Promise<RotatedSession> {
    const presentedHash = this.digest(token);
    const now = new Date();

    const session = await this.prisma.authSession.findFirst({
      where: { OR: [{ tokenHash: presentedHash }, { previousTokenHash: presentedHash }] },
      select: {
        id: true,
        tokenHash: true,
        rotatedAt: true,
        expiresAt: true,
        revokedAt: true,
        user: { select: userPublicSelect },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw invalidRefreshToken();
    }

    if (session.tokenHash !== presentedHash) {
      const withinGrace =
        session.rotatedAt !== null &&
        now.getTime() - session.rotatedAt.getTime() < REFRESH_REUSE_GRACE_MS;
      if (!withinGrace) {
        await this.revokeById(session.id);
        this.logger.warn(
          { sessionId: session.id, userId: session.user.id },
          "Refresh token reuse detected; session revoked",
        );
      }
      throw invalidRefreshToken();
    }

    if (!session.user.isActive) {
      await this.revokeById(session.id);
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_DISABLED,
        "This account has been disabled.",
      );
    }

    const nextToken = this.generateToken();
    const expiresAt = this.nextExpiry();
    const { count } = await this.prisma.authSession.updateMany({
      // Matching on the current hash makes rotation atomic: of two concurrent
      // refreshes with the same token, exactly one wins.
      where: { id: session.id, tokenHash: presentedHash, revokedAt: null },
      data: {
        tokenHash: this.digest(nextToken),
        previousTokenHash: presentedHash,
        rotatedAt: now,
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    if (count === 0) throw invalidRefreshToken();

    return { sessionId: session.id, token: nextToken, expiresAt, user: session.user };
  }

  /** Idempotent: unknown or already-revoked tokens are ignored. */
  async revokeByToken(token: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { tokenHash: this.digest(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeById(id: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private digest(token: string): string {
    return createHmac("sha256", this.config.auth.refreshTokenSecret)
      .update(token)
      .digest("base64url");
  }

  private nextExpiry(): Date {
    return new Date(Date.now() + this.config.auth.refreshTokenTtlDays * DAY_MS);
  }
}

function invalidRefreshToken(): ApiException {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    ErrorCode.INVALID_REFRESH_TOKEN,
    "The session is invalid or has expired. Please sign in again.",
  );
}
