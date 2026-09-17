import type { PrismaService } from "../../../src/database/prisma.service.js";
import { API, type Http } from "./test-app.js";

let counter = 0;

export interface RegisteredUser {
  id: string;
  email: string;
  password: string;
  accessToken: string;
  /** `spokes_rt=<token>` as sent back by a browser. */
  refreshCookie: string;
}

export async function registerUser(
  http: Http,
  overrides: Partial<{ email: string; password: string; firstName: string }> = {},
): Promise<RegisteredUser> {
  counter += 1;
  const email = overrides.email ?? `rider${counter}-${Date.now()}@example.com`;
  const password = overrides.password ?? "correct-horse-battery";
  const response = await http
    .post(`${API}/auth/register`)
    .send({ email, password, firstName: overrides.firstName ?? "Test" })
    .expect(201);

  return {
    id: response.body.data.user.id,
    email,
    password,
    accessToken: response.body.data.accessToken,
    refreshCookie: extractRefreshCookie(response.headers["set-cookie"]),
  };
}

/** Registers a user, promotes it to ADMIN and signs in again so the token carries the role. */
export async function registerAdmin(http: Http, prisma: PrismaService): Promise<RegisteredUser> {
  const user = await registerUser(http, { firstName: "Admin" });
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  const login = await http
    .post(`${API}/auth/login`)
    .send({ email: user.email, password: user.password })
    .expect(200);
  return { ...user, accessToken: login.body.data.accessToken };
}

export function extractRefreshCookie(setCookie: string[] | string | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const cookie = cookies.find((value) => value.startsWith("spokes_rt="));
  if (!cookie) throw new Error("No refresh cookie in response");
  return cookie.split(";")[0] ?? "";
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** A real 4×3 RGB PNG (73 bytes). */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEElEQVR4nGO44KAARww4OQAeVg5BTxog1AAAAABJRU5ErkJggg==",
  "base64",
);
