import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * JSON with object keys in sorted order, so the same plan always produces the
 * same text no matter how a client's JSON round trip ordered its keys.
 */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/**
 * Signs journey plans so a rider can only save a plan this API generated.
 * Guests can plan without an account, so nothing is stored until they save;
 * the signature is what lets the server trust the plan it gets back, unchanged,
 * without keeping every generated plan or re-validating every field.
 */
export class PlanSigner {
  private readonly key: Buffer;

  constructor(secret: string) {
    // A key of its own, derived from the server secret, so it is never the JWT key itself.
    this.key = createHmac("sha256", secret).update("36spokes:journey-plan:v1").digest();
  }

  sign(plan: unknown): string {
    return createHmac("sha256", this.key).update(stableStringify(plan)).digest("base64url");
  }

  verify(plan: unknown, token: string): boolean {
    const expected = Buffer.from(this.sign(plan));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}
