import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { AppRequest } from "../../common/http/app-request.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { ROLES_KEY } from "../auth.constants.js";

/** Global guard enforcing @Roles(). Runs after JwtAuthGuard. ADMIN satisfies any role. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<AppRequest>().user;
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "Authentication required.",
      );
    }

    if (user.role === UserRole.ADMIN || required.includes(user.role)) return true;

    throw new ApiException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      "You do not have permission to perform this action.",
    );
  }
}
