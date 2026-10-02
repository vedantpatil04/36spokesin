import { SetMetadata } from "@nestjs/common";

export const PLAN_RATE_LIMIT_KEY = "plan:rateLimit";

/**
 * Applies the stricter PLAN_RATE_LIMIT_MAX limit (per client) to journey
 * planning: each uncached plan calls four public data services and an AI
 * provider, so it is the most expensive request the API serves.
 */
export const PlanRateLimit = () => SetMetadata(PLAN_RATE_LIMIT_KEY, true);
