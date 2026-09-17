import { HttpStatus, Injectable } from "@nestjs/common";
import { ApiException } from "../common/errors/api-exception.js";
import { ErrorCode } from "../common/errors/error-codes.js";
import { CursorPage } from "../common/http/cursor-page.js";
import { PrismaService } from "../database/prisma.service.js";
import type { UpdateMeDto } from "./dto/update-me.dto.js";
import type { ListUsersQueryDto } from "./dto/list-users-query.dto.js";
import type { UserResponseDto } from "./dto/user-response.dto.js";
import { toUserResponse, userPublicSelect } from "./user.mapper.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The signed-in account. A deleted account's still-valid token gets 401; a disabled one 403. */
  async getCurrent(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "Authentication required.",
      );
    }
    if (!user.isActive) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_DISABLED,
        "This account has been disabled.",
      );
    }
    return toUserResponse(user);
  }

  async updateCurrent(userId: string, dto: UpdateMeDto): Promise<UserResponseDto> {
    await this.getCurrent(userId);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
      select: userPublicSelect,
    });
    return toUserResponse(user);
  }

  async list(query: ListUsersQueryDto): Promise<CursorPage<UserResponseDto>> {
    const rows = await this.prisma.user.findMany({
      where: query.role ? { role: query.role } : {},
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: userPublicSelect,
    });
    return CursorPage.fromRows(rows, query.limit, toUserResponse);
  }

  async getById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userPublicSelect });
    if (!user) {
      throw new ApiException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, "User not found.");
    }
    return toUserResponse(user);
  }
}
