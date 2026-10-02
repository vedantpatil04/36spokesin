import { type AiProvider, AiProviderError, type AiRequest } from "./ai-provider.js";

/** No provider could be reached. The rider is asked to try again later. */
export class AiUnavailableError extends Error {
  constructor() {
    super("No AI provider is available");
    this.name = "AiUnavailableError";
  }
}

/** A provider answered twice, and neither answer passed validation. */
export class AiInvalidAnswerError extends Error {
  constructor(readonly problems: string[]) {
    super("The AI answer did not pass validation");
    this.name = "AiInvalidAnswerError";
  }
}

export type Checked<T> = { ok: true; value: T } | { ok: false; problems: string[] };

export type AiResult<T> = { value: T; provider: string; providerLabel: string; model: string };

export type AiLogger = { warn: (context: Record<string, unknown>, message: string) => void };

/**
 * Asks the providers in order (Gemini, then Ollama) and returns the first
 * answer that passes the caller's check. One provider is tried at a time: the
 * next is only asked when the one before could not answer at all (timeout,
 * outage, rate limit, quota, bad configuration).
 *
 * An answer that fails the check is sent back once to the same provider with
 * the problems listed. A second failure is an error, not a reason to show
 * unvalidated output.
 */
export class AiService {
  constructor(
    private readonly providers: readonly AiProvider[],
    private readonly logger: AiLogger,
  ) {}

  /** Providers that will be attempted, in order. */
  get available(): readonly AiProvider[] {
    return this.providers.filter((provider) => provider.configured);
  }

  async generate<T>(request: AiRequest, check: (text: string) => Checked<T>): Promise<AiResult<T>> {
    for (const provider of this.available) {
      let first;
      try {
        first = await provider.generate(request);
      } catch (error) {
        this.logFailure(provider, error);
        continue;
      }
      const checked = check(first.text);
      if (checked.ok) return this.result(provider, first.model, checked.value);

      this.logger.warn(
        { provider: provider.name, problems: checked.problems },
        "AI answer rejected; retrying once",
      );
      let second;
      try {
        second = await provider.generate({
          ...request,
          user: `${request.user}\n\n${correction(checked.problems)}`,
        });
      } catch (error) {
        this.logFailure(provider, error);
        continue;
      }
      const rechecked = check(second.text);
      if (rechecked.ok) return this.result(provider, second.model, rechecked.value);
      throw new AiInvalidAnswerError(rechecked.problems);
    }
    throw new AiUnavailableError();
  }

  private result<T>(provider: AiProvider, model: string, value: T): AiResult<T> {
    return { value, provider: provider.name, providerLabel: provider.label, model };
  }

  private logFailure(provider: AiProvider, error: unknown): void {
    const detail =
      error instanceof AiProviderError
        ? error.detail
        : error instanceof Error
          ? error.message
          : "unknown";
    this.logger.warn({ provider: provider.name, detail }, "AI provider failed; trying the next");
  }
}

function correction(problems: string[]): string {
  return [
    "Your previous answer was rejected for these reasons:",
    ...problems.slice(0, 12).map((problem) => `- ${problem}`),
    "Answer again with JSON that fixes every one of them. Use only ids from the supplied places.",
  ].join("\n");
}
