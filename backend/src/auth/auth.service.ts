import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import type { RequestMeta } from "../common/http/app-request.js";
import { PrismaService } from "../database/prisma.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { type PublicUser, toUserResponse, userPublicSelect } from "../users/user.mapper.js";
import type { UserResponseDto } from "../users/dto/user-response.dto.js";
import type { LoginDto } from "./dto/login.dto.js";
import type { RegisterDto } from "./dto/register.dto.js";
import { PasswordService } from "./password.service.js";
import { type IssuedRefreshToken, SessionsService } from "./sessions.service.js";
import { TokenService } from "./token.service.js";

/** Everything a successful sign-in produces. The controller decides how the refresh token travels. */
export interface AuthResult {
  user: UserResponseDto;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly tokens: TokenService,
  ) {}

  /** Creates a RIDER account with an empty rider profile, then signs it in. */
  async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResult> {
    const passwordHash = await this.passwords.hash(dto.password);

    let user: PublicUser;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          phone: dto.phone ?? null,
          riderProfile: { create: {} },
        },
        select: userPublicSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ApiException(
          HttpStatus.CONFLICT,
          ErrorCode.EMAIL_ALREADY_REGISTERED,
          "An account with this email already exists.",
        );
      }
      throw error;
    }

    this.logger.log({ userId: user.id }, "Account registered");
    return this.issue(user, await this.sessions.create(user.id, meta));
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResult> {
    const record = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { ...userPublicSelect, passwordHash: true },
    });

    if (!record) {
      await this.passwords.verifyAgainstDummy(dto.password);
      this.logger.warn({ ip: meta.ipAddress, reason: "unknown_account" }, "Login failed");
      throw invalidCredentials();
    }

    if (!(await this.passwords.verify(record.passwordHash, dto.password))) {
      this.logger.warn(
        { userId: record.id, ip: meta.ipAddress, reason: "bad_password" },
        "Login failed",
      );
      throw invalidCredentials();
    }

    if (!record.isActive) {
      this.logger.warn({ userId: record.id, reason: "disabled" }, "Login refused");
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_DISABLED,
        "This account has been disabled.",
      );
    }

    const { passwordHash, ...user } = record;
    if (this.passwords.needsRehash(passwordHash)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await this.passwords.hash(dto.password) },
      });
    }

    return this.issue(user, await this.sessions.create(user.id, meta));
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResult> {
    const rotated = await this.sessions.rotate(refreshToken, meta);
    return this.issue(rotated.user, rotated);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.revokeByToken(refreshToken);
  }

  private async issue(user: PublicUser, session: IssuedRefreshToken): Promise<AuthResult> {
    return {
      user: toUserResponse(user),
      accessToken: await this.tokens.signAccessToken(user, session.sessionId),
      expiresIn: this.tokens.accessTokenTtlSeconds,
      refreshToken: session.token,
      refreshTokenExpiresAt: session.expiresAt,
    };
  }
}

function invalidCredentials(): ApiException {
  return new ApiException(
    HttpStatus.UNAUTHORIZED,
    ErrorCode.INVALID_CREDENTIALS,
    "Invalid email or password.",
  );
}
