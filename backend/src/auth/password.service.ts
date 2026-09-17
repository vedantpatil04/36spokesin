import { Injectable } from "@nestjs/common";
import { argon2id, hash, needsRehash, verify } from "argon2";

/** OWASP-recommended argon2id parameters (19 MiB, 2 iterations, 1 lane). */
const HASH_OPTIONS = { type: argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

@Injectable()
export class PasswordService {
  private dummyHash: Promise<string> | undefined;

  hash(password: string): Promise<string> {
    return hash(password, HASH_OPTIONS);
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /** True when a stored hash was produced with weaker parameters than today's. */
  needsRehash(passwordHash: string): boolean {
    try {
      return needsRehash(passwordHash, {
        memoryCost: HASH_OPTIONS.memoryCost,
        timeCost: HASH_OPTIONS.timeCost,
      });
    } catch {
      return false;
    }
  }

  /**
   * Spends the same time as a real verification. Used when the account does not
   * exist so response timing does not reveal which emails are registered.
   */
  async verifyAgainstDummy(password: string): Promise<void> {
    this.dummyHash ??= hash("36spokes-timing-equaliser", HASH_OPTIONS);
    await this.verify(await this.dummyHash, password);
  }
}
