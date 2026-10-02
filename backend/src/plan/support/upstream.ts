/**
 * One way to call the public travel-data services: a timeout, a User-Agent that
 * identifies this app (their usage policies require it), JSON in and out, and an
 * error that never carries the provider's response to a client.
 */

export class UpstreamError extends Error {
  constructor(
    /** Which service failed, e.g. "routing". For logs only. */
    readonly service: string,
    /** HTTP status, or null when nothing came back (timeout, network). */
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }

  /** Worth trying again later, or with another provider. */
  get temporary(): boolean {
    return this.status === null || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

export type UpstreamRequest = {
  service: string;
  url: string;
  userAgent: string;
  timeoutMs: number;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
};

export type FetchLike = typeof fetch;

export async function fetchJson<T>(
  request: UpstreamRequest,
  fetchFn: FetchLike = fetch,
): Promise<T> {
  let response: Response;
  try {
    response = await fetchFn(request.url, {
      method: request.method ?? "GET",
      headers: { Accept: "application/json", "User-Agent": request.userAgent, ...request.headers },
      ...(request.body !== undefined ? { body: request.body } : {}),
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new UpstreamError(
      request.service,
      null,
      timedOut ? `${request.service} timed out` : `${request.service} could not be reached`,
    );
  }

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new UpstreamError(
      request.service,
      response.status,
      `${request.service} answered ${response.status}: ${text.slice(0, 200)}`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new UpstreamError(
      request.service,
      response.status,
      `${request.service} sent invalid JSON`,
    );
  }
}
