import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "../../generated/prisma/enums.js";
import { ROLES_KEY } from "../auth.constants.js";

/**
 * Restricts a route (or controller) to the listed roles. ADMIN always passes.
 * Example: `@Roles(UserRole.CONTENT_MANAGER)` once that role exists.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
