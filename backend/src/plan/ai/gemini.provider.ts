import { type FetchLike, UpstreamError, fetchJson } from "../support/upstream.js";
import {
  type AiProvider,
  AiProviderError,
  type AiRequest,
  type AiResponse,
  type JsonSchema,
} from "./ai-provider.js";

export type GeminiOptions = {
  apiKey: string | null;
  /** Null: use a current Flash model the API reports. */
  model: string | null;
  baseUrl: string;
  timeoutMs: number;
  userAgent: string;
  fetchFn?: FetchLike;
};

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

type ModelList = { models?: { name?: string; supportedGenerationMethods?: string[] }[] };

/** Model families that answer text prompts but aren't the general model wanted here. */
const SPECIALISED =
  /(image|tts|audio|live|embedding|vision|robotics|computer-use|lite|preview|exp)/i;

/** Gemini's schema format names types in upper case and has no "additionalProperties". */
function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  return {
    type: schema.type.toUpperCase(),
    ...(schema.description ? { description: schema.description } : {}),
    ...(schema.nullable ? { nullable: true } : {}),
    ...(schema.enum ? { enum: schema.enum } : {}),
    ...(schema.items ? { items: toGeminiSchema(schema.items) } : {}),
    ...(schema.properties
      ? {
          properties: Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]),
          ),
          ...(schema.required ? { required: schema.required } : {}),
        }
      : {}),
  };
}

/** Google Gemini through its REST API. The key is sent in a header and never logged. */
export class GeminiProvider implements AiProvider {
  readonly name = "gemini";
  readonly label = "Gemini";
  private resolvedModel: string | null;

  constructor(private readonly options: GeminiOptions) {
    this.resolvedModel = options.model;
  }

  get configured(): boolean {
    return Boolean(this.options.apiKey);
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    const model = await this.model();
    const body = await this.call<GenerateResponse>(
      `/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        systemInstruction: { parts: [{ text: request.system }] },
        contents: [{ role: "user", parts: [{ text: request.user }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(request.schema),
        },
      },
    );
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("");
    if (!text.trim()) {
      const reason =
        body.promptFeedback?.blockReason ?? body.candidates?.[0]?.finishReason ?? "empty";
      throw new AiProviderError(this.name, `no answer (${reason})`);
    }
    return { text, model };
  }

  /** The configured model, or the newest general Flash model the key can use. */
  private async model(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel;
    const list = await this.call<ModelList>("/v1beta/models?pageSize=200");
    const usable = (list.models ?? [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => (model.name ?? "").replace(/^models\//, ""))
      .filter((name) => name.startsWith("gemini-") && !SPECIALISED.test(name));
    // Names sort by version ("gemini-2.5-flash" after "gemini-2.0-flash"); take the newest Flash.
    const flash = usable.filter((name) => /flash/.test(name)).sort();
    const chosen = flash[flash.length - 1] ?? usable.sort()[usable.length - 1];
    if (!chosen) throw new AiProviderError(this.name, "no usable model is available to this key");
    this.resolvedModel = chosen;
    return chosen;
  }

  private async call<T>(path: string, body?: unknown): Promise<T> {
    if (!this.options.apiKey) throw new AiProviderError(this.name, "not configured");
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fetchJson<T>(
          {
            service: "gemini",
            url: `${this.options.baseUrl}${path}`,
            userAgent: this.options.userAgent,
            timeoutMs: this.options.timeoutMs,
            method: body === undefined ? "GET" : "POST",
            headers: {
              "x-goog-api-key": this.options.apiKey,
              ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          },
          this.options.fetchFn,
        );
      } catch (error) {
        if (error instanceof UpstreamError && error.status === 503 && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
          continue;
        }
        if (error instanceof UpstreamError) {
          // The status is enough to tell quota, outage and bad configuration apart in the logs.
          throw new AiProviderError(this.name, `HTTP ${error.status ?? "none"}: ${error.message}`);
        }
        throw error;
      }
    }
    throw new AiProviderError(this.name, "HTTP 503: high demand exhausted retries");
  }
}
