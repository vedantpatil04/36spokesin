import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { ApiException, type ErrorDetail } from "./api-exception.js";
import { ErrorCode, defaultErrorCode } from "./error-codes.js";

export interface ErrorBody {
  error: {
    statusCode: number;
    code: string;
    message: string;
    details?: ErrorDetail[];
    requestId?: string;
    path: string;
    timestamp: string;
  };
}

interface Resolved {
  status: number;
  code: string;
  message: string;
  details?: ErrorDetail[];
}

const GENERIC_SERVER_MESSAGE = "An unexpected error occurred. Please try again later.";

/**
 * Single place where errors become HTTP responses. Client-facing bodies never
 * contain stack traces, SQL, connection strings or internal paths; server logs
 * keep the full error for 5xx responses.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const response = http.getResponse<Response>();

    const resolved = this.resolve(exception);

    if (resolved.status >= 500) {
      this.logger.error(
        { err: exception, requestId: request.id, path: request.path },
        exception instanceof Error ? exception.message : "Unhandled non-error exception",
      );
    }

    if (response.headersSent) return;

    const body: ErrorBody = {
      error: {
        statusCode: resolved.status,
        code: resolved.code,
        message: resolved.message,
        ...(resolved.details ? { details: resolved.details } : {}),
        ...(typeof request.id === "string" ? { requestId: request.id } : {}),
        path: request.originalUrl.split("?")[0] ?? request.path,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(resolved.status).json(body);
  }

  private resolve(exception: unknown): Resolved {
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      };
    }

    if (exception instanceof HttpException) {
      // Framework-raised errors (unknown route, malformed JSON, throttling). A bare 400
      // from the framework can echo parser internals, so it gets a fixed message.
      const status = exception.getStatus();
      const message =
        status >= 500
          ? GENERIC_SERVER_MESSAGE
          : status === 400
            ? "The request is malformed."
            : extractHttpMessage(exception);
      return { status, code: defaultErrorCode(status), message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        return { status: 409, code: ErrorCode.CONFLICT, message: "The resource already exists." };
      }
      if (exception.code === "P2025") {
        return { status: 404, code: ErrorCode.NOT_FOUND, message: "The resource was not found." };
      }
      if (exception.code === "P2003") {
        return {
          status: 409,
          code: ErrorCode.CONFLICT,
          message: "The request references a resource that does not exist.",
        };
      }
    }

    // Errors raised by Express middleware (body-parser, etc.) carry an HTTP status.
    const middlewareStatus = readMiddlewareStatus(exception);
    if (middlewareStatus !== null && middlewareStatus < 500) {
      return {
        status: middlewareStatus,
        code: defaultErrorCode(middlewareStatus),
        message:
          middlewareStatus === 413
            ? "The request body is too large."
            : "The request could not be processed.",
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: GENERIC_SERVER_MESSAGE,
    };
  }
}

function extractHttpMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === "string") return response;
  if (response && typeof response === "object" && "message" in response) {
    const { message } = response as { message: unknown };
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.filter((m) => typeof m === "string").join("; ");
  }
  return exception.message;
}

function readMiddlewareStatus(exception: unknown): number | null {
  if (!exception || typeof exception !== "object") return null;
  const { status, statusCode } = exception as { status?: unknown; statusCode?: unknown };
  const candidate = status ?? statusCode;
  return typeof candidate === "number" && candidate >= 400 && candidate < 600 ? candidate : null;
}
