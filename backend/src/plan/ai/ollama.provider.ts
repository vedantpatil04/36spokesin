import { type FetchLike, UpstreamError, fetchJson } from "../support/upstream.js";
import {
  type AiProvider,
  AiProviderError,
  type AiRequest,
  type AiResponse,
} from "./ai-provider.js";

export type OllamaOptions = {
  baseUrl: string;
  /** Null: use the first model installed. */
  model: string | null;
  timeoutMs: number;
  userAgent: string;
  fetchFn?: FetchLike;
};

type ChatResponse = { message?: { content?: string } };
type TagList = { models?: { name?: string }[] };

/** A local Ollama server. No key: it is "configured" whenever it is listed as a provider. */
export class OllamaProvider implements AiProvider {
  readonly name = "ollama";
  readonly label = "Ollama";
  readonly configured = true;
  private resolvedModel: string | null;

  constructor(private readonly options: OllamaOptions) {
    this.resolvedModel = options.model;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    const model = await this.model();
    const body = await this.call<ChatResponse>("/api/chat", {
      model,
      stream: false,
      // Ollama constrains the answer to this JSON schema.
      format: request.schema,
      options: { temperature: 0.3 },
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
    });
    const text = body.message?.content ?? "";
    if (!text.trim()) throw new AiProviderError(this.name, "no answer (empty)");
    return { text, model };
  }

  private async model(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel;
    const tags = await this.call<TagList>("/api/tags");
    const first = tags.models?.[0]?.name;
    if (!first) throw new AiProviderError(this.name, "no model is installed");
    this.resolvedModel = first;
    return first;
  }

  private async call<T>(path: string, body?: unknown): Promise<T> {
    try {
      return await fetchJson<T>(
        {
          service: "ollama",
          url: `${this.options.baseUrl}${path}`,
          userAgent: this.options.userAgent,
          timeoutMs: this.options.timeoutMs,
          method: body === undefined ? "GET" : "POST",
          ...(body === undefined
            ? {}
            : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
        },
        this.options.fetchFn,
      );
    } catch (error) {
      if (error instanceof UpstreamError) {
        throw new AiProviderError(this.name, `HTTP ${error.status ?? "none"}: ${error.message}`);
      }
      throw error;
    }
  }
}
