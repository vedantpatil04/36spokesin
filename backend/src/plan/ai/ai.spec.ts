import { type AiProvider, AiProviderError, type AiRequest } from "./ai-provider.js";
import { AiInvalidAnswerError, AiService, AiUnavailableError, type Checked } from "./ai.service.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OllamaProvider } from "./ollama.provider.js";

const REQUEST: AiRequest = {
  system: "rules",
  user: "facts",
  schema: {
    type: "object",
    required: ["n"],
    properties: {
      n: { type: "integer", nullable: true },
      tags: { type: "array", items: { type: "string" } },
    },
  },
};

/** Accepts {"n": <number>} and nothing else. */
const check = (text: string): Checked<number> => {
  try {
    const value = (JSON.parse(text) as { n?: unknown }).n;
    return typeof value === "number"
      ? { ok: true, value }
      : { ok: false, problems: ["n must be a number"] };
  } catch {
    return { ok: false, problems: ["not JSON"] };
  }
};

function provider(name: string, answers: (string | Error)[], configured = true) {
  const generate = vi.fn(async (_request: AiRequest) => {
    const next = answers.shift();
    if (next === undefined) throw new Error("no more answers");
    if (next instanceof Error) throw next;
    return { text: next, model: `${name}-model` };
  });
  return { name, label: name.toUpperCase(), configured, generate } satisfies AiProvider;
}

const logger = { warn: vi.fn() };

describe("AiService", () => {
  it("uses the primary and never calls the fallback when it answers", async () => {
    const gemini = provider("gemini", ['{"n":1}']);
    const ollama = provider("ollama", ['{"n":2}']);
    const result = await new AiService([gemini, ollama], logger).generate(REQUEST, check);
    expect(result).toEqual({
      value: 1,
      provider: "gemini",
      providerLabel: "GEMINI",
      model: "gemini-model",
    });
    expect(ollama.generate).not.toHaveBeenCalled();
  });

  it("falls back to the next provider when the primary can't answer", async () => {
    const gemini = provider("gemini", [new AiProviderError("gemini", "HTTP 429: quota")]);
    const ollama = provider("ollama", ['{"n":2}']);
    const result = await new AiService([gemini, ollama], logger).generate(REQUEST, check);
    expect(result.provider).toBe("ollama");
    expect(gemini.generate).toHaveBeenCalledTimes(1);
    expect(ollama.generate).toHaveBeenCalledTimes(1);
  });

  it("skips a provider that isn't configured", async () => {
    const gemini = provider("gemini", [], false);
    const ollama = provider("ollama", ['{"n":3}']);
    const result = await new AiService([gemini, ollama], logger).generate(REQUEST, check);
    expect(result.provider).toBe("ollama");
    expect(gemini.generate).not.toHaveBeenCalled();
  });

  it("reports unavailability when every provider fails", async () => {
    const service = new AiService(
      [provider("gemini", [new Error("timeout")]), provider("ollama", [new Error("refused")])],
      logger,
    );
    await expect(service.generate(REQUEST, check)).rejects.toBeInstanceOf(AiUnavailableError);
    await expect(new AiService([], logger).generate(REQUEST, check)).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });

  it("retries a rejected answer once, telling the model what was wrong", async () => {
    const gemini = provider("gemini", ['{"n":"one"}', '{"n":1}']);
    const result = await new AiService([gemini], logger).generate(REQUEST, check);
    expect(result.value).toBe(1);
    expect(gemini.generate).toHaveBeenCalledTimes(2);
    expect(gemini.generate.mock.calls[1]![0].user).toContain("- n must be a number");
  });

  it("refuses to return an answer that fails twice, and doesn't hand it to the fallback", async () => {
    const gemini = provider("gemini", ["nonsense", '{"n":"still wrong"}']);
    const ollama = provider("ollama", ['{"n":2}']);
    const failure = await new AiService([gemini, ollama], logger)
      .generate(REQUEST, check)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AiInvalidAnswerError);
    expect((failure as AiInvalidAnswerError).problems).toEqual(["n must be a number"]);
    expect(ollama.generate).not.toHaveBeenCalled();
  });
});

type Call = { url: string; init: RequestInit };

function fakeFetch(respond: (call: Call) => Response) {
  const calls: Call[] = [];
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
  return { fetchFn, calls };
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("GeminiProvider", () => {
  const options = {
    apiKey: "test-key",
    model: "gemini-test",
    baseUrl: "https://gemini.test",
    timeoutMs: 1000,
    userAgent: "test",
  };

  it("is not configured without a key", () => {
    expect(new GeminiProvider({ ...options, apiKey: null }).configured).toBe(false);
    expect(new GeminiProvider(options).configured).toBe(true);
  });

  it("asks for JSON in the given shape and keeps the key in a header", async () => {
    const { fetchFn, calls } = fakeFetch(() =>
      json({ candidates: [{ content: { parts: [{ text: '{"n":' }, { text: "5}" }] } }] }),
    );
    const answer = await new GeminiProvider({ ...options, fetchFn }).generate(REQUEST);
    expect(answer).toEqual({ text: '{"n":5}', model: "gemini-test" });

    const call = calls[0]!;
    expect(call.url).toBe("https://gemini.test/v1beta/models/gemini-test:generateContent");
    expect(call.url).not.toContain("test-key");
    expect((call.init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
    const body = JSON.parse(call.init.body as string) as {
      systemInstruction: { parts: { text: string }[] };
      generationConfig: { responseMimeType: string; responseSchema: unknown };
    };
    expect(body.systemInstruction.parts[0]?.text).toBe("rules");
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema).toEqual({
      type: "OBJECT",
      required: ["n"],
      properties: {
        n: { type: "INTEGER", nullable: true },
        tags: { type: "ARRAY", items: { type: "STRING" } },
      },
    });
  });

  it("picks a current general Flash model when none is configured", async () => {
    const { fetchFn, calls } = fakeFetch((call) =>
      call.url.includes("/models?")
        ? json({
            models: [
              { name: "models/gemini-2.0-flash", supportedGenerationMethods: ["generateContent"] },
              { name: "models/gemini-2.5-flash", supportedGenerationMethods: ["generateContent"] },
              {
                name: "models/gemini-2.5-flash-lite",
                supportedGenerationMethods: ["generateContent"],
              },
              {
                name: "models/gemini-2.5-flash-image",
                supportedGenerationMethods: ["generateContent"],
              },
              { name: "models/gemini-embedding-001", supportedGenerationMethods: ["embedContent"] },
            ],
          })
        : json({ candidates: [{ content: { parts: [{ text: '{"n":1}' }] } }] }),
    );
    const gemini = new GeminiProvider({ ...options, model: null, fetchFn });
    expect((await gemini.generate(REQUEST)).model).toBe("gemini-2.5-flash");
    await gemini.generate(REQUEST);
    // The model list is fetched once, then remembered.
    expect(calls.filter((call) => call.url.includes("/models?"))).toHaveLength(1);
  });

  it("fails without leaking the provider's response or the key", async () => {
    const { fetchFn } = fakeFetch(() =>
      json({ error: { message: "quota exceeded for key test-key" } }, 429),
    );
    const failure = await new GeminiProvider({ ...options, fetchFn })
      .generate(REQUEST)
      .catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AiProviderError);
    expect((failure as AiProviderError).detail).toContain("HTTP 429");

    const empty = fakeFetch(() =>
      json({ candidates: [], promptFeedback: { blockReason: "SAFETY" } }),
    );
    await expect(
      new GeminiProvider({ ...options, fetchFn: empty.fetchFn }).generate(REQUEST),
    ).rejects.toThrow("no answer (SAFETY)");
  });
});

describe("OllamaProvider", () => {
  const options = {
    baseUrl: "http://ollama.test",
    model: "llama-test",
    timeoutMs: 1000,
    userAgent: "test",
  };

  it("sends the schema as the answer format", async () => {
    const { fetchFn, calls } = fakeFetch(() => json({ message: { content: '{"n":9}' } }));
    const answer = await new OllamaProvider({ ...options, fetchFn }).generate(REQUEST);
    expect(answer).toEqual({ text: '{"n":9}', model: "llama-test" });
    const body = JSON.parse(calls[0]!.init.body as string) as { messages: { role: string }[] };
    expect(calls[0]!.url).toBe("http://ollama.test/api/chat");
    expect(body).toMatchObject({ model: "llama-test", stream: false, format: REQUEST.schema });
    expect(body.messages.map((message) => message.role)).toEqual(["system", "user"]);
  });

  it("uses the first installed model when none is configured, and fails cleanly when down", async () => {
    const { fetchFn } = fakeFetch((call) =>
      call.url.endsWith("/api/tags")
        ? json({ models: [{ name: "qwen-local" }] })
        : json({ message: { content: '{"n":1}' } }),
    );
    expect(
      (await new OllamaProvider({ ...options, model: null, fetchFn }).generate(REQUEST)).model,
    ).toBe("qwen-local");

    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    await expect(
      new OllamaProvider({ ...options, fetchFn: down }).generate(REQUEST),
    ).rejects.toBeInstanceOf(AiProviderError);
  });
});
