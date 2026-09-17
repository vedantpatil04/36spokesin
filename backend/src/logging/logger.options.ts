import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Params } from "nestjs-pino";
import type { AppConfigService } from "../config/app-config.service.js";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

/**
 * Structured JSON logs (pretty-printed in development). Every request gets an id,
 * echoed as `X-Request-Id` and included in error bodies, so a client report can
 * be traced to server logs. Credentials and cookies are never written.
 */
export function createLoggerOptions(config: AppConfigService): Params {
  return {
    pinoHttp: {
      level: config.logging.level,
      ...(config.logging.pretty
        ? { transport: { target: "pino-pretty", options: { singleLine: true, colorize: true } } }
        : {}),
      genReqId: (request: IncomingMessage, response: ServerResponse) => {
        const incoming = request.headers["x-request-id"];
        const id =
          typeof incoming === "string" && REQUEST_ID_PATTERN.test(incoming)
            ? incoming
            : randomUUID();
        response.setHeader("X-Request-Id", id);
        return id;
      },
      customLogLevel: (_request, response, error) => {
        if (error || response.statusCode >= 500) return "error";
        if (response.statusCode >= 400) return "warn";
        return "info";
      },
      autoLogging: {
        ignore: (request) => request.url?.startsWith("/api/v1/health") ?? false,
      },
      serializers: {
        req: (request: { id: unknown; method: string; url: string; remoteAddress?: string }) => ({
          id: request.id,
          method: request.method,
          // Query strings are dropped: they can carry identifiers worth keeping out of logs.
          path: request.url.split("?")[0],
          remoteAddress: request.remoteAddress,
        }),
        res: (response: { statusCode: number }) => ({ statusCode: response.statusCode }),
      },
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          'res.headers["set-cookie"]',
          "*.password",
          "*.passwordHash",
          "*.refreshToken",
          "*.accessToken",
        ],
        censor: "[redacted]",
      },
    },
  };
}
