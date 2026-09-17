import type { Request } from "express";
import type { AuthUser } from "../../auth/auth-user.js";

/** Express request as seen by this API: pino-http assigns `id`, JwtAuthGuard assigns `user`. */
export type AppRequest = Request & {
  id?: unknown;
  user?: AuthUser;
};

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export function requestMeta(request: Request): RequestMeta {
  const userAgent = request.get("user-agent");
  return {
    ipAddress: request.ip ?? null,
    userAgent: userAgent ? userAgent.slice(0, 512) : null,
  };
}
