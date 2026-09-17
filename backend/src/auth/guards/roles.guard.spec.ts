import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ApiException } from "../../common/errors/api-exception.js";
import { UserRole } from "../../generated/prisma/enums.js";
import type { AuthUser } from "../auth-user.js";
import { RolesGuard } from "./roles.guard.js";

function contextFor(user: AuthUser | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: UserRole[] | undefined): RolesGuard {
  const reflector = new Reflector();
  vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(roles);
  return new RolesGuard(reflector);
}

const rider: AuthUser = { id: "u1", role: UserRole.RIDER, sessionId: "s1" };
const admin: AuthUser = { id: "u2", role: UserRole.ADMIN, sessionId: "s2" };

describe("RolesGuard", () => {
  it("allows routes without role requirements", () => {
    expect(guardRequiring(undefined).canActivate(contextFor(rider))).toBe(true);
    expect(guardRequiring([]).canActivate(contextFor(rider))).toBe(true);
  });

  it("allows listed roles and always allows ADMIN", () => {
    expect(guardRequiring([UserRole.RIDER]).canActivate(contextFor(rider))).toBe(true);
    expect(guardRequiring([UserRole.RIDER]).canActivate(contextFor(admin))).toBe(true);
  });

  it("forbids roles that are not listed", () => {
    expect(() => guardRequiring([UserRole.ADMIN]).canActivate(contextFor(rider))).toThrow(
      ApiException,
    );
  });

  it("requires an authenticated user when roles are required", () => {
    try {
      guardRequiring([UserRole.ADMIN]).canActivate(contextFor(undefined));
      expect.unreachable();
    } catch (error) {
      expect((error as ApiException).getStatus()).toBe(401);
    }
  });
});
