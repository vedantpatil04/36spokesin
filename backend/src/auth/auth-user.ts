import type { UserRole } from "../generated/prisma/enums.js";

/** The authenticated principal attached to a request by JwtAuthGuard. */
export interface AuthUser {
  id: string;
  role: UserRole;
  sessionId: string;
}
