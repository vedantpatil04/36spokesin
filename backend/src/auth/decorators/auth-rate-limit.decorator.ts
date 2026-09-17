import { SetMetadata } from "@nestjs/common";
import { AUTH_RATE_LIMIT_KEY } from "../auth.constants.js";

/** Applies the stricter RATE_LIMIT_AUTH_MAX limit (per client, per route) to credential endpoints. */
export const AuthRateLimit = () => SetMetadata(AUTH_RATE_LIMIT_KEY, true);
