import { type ExecutionContext, HttpStatus, createParamDecorator } from "@nestjs/common";
import { ApiException } from "../../common/errors/api-exception.js";
import { ErrorCode } from "../../common/errors/error-codes.js";
import type { AppRequest } from "../../common/http/app-request.js";
import type { AuthUser } from "../auth-user.js";

/** Injects the authenticated user. Only valid on routes that are not @Public(). */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser => {
    const user = context.switchToHttp().getRequest<AppRequest>().user;
    if (!user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
        "Authentication required.",
      );
    }
    return user;
  },
);
