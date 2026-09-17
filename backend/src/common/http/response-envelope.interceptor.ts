import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { type Observable, map } from "rxjs";
import { CursorPage } from "./cursor-page.js";

/**
 * Wraps successful responses in a consistent envelope:
 *   `{ data }` for single resources, `{ data, meta }` for pages.
 * Handlers that return nothing (204) are left untouched.
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    return next.handle().pipe(
      map((body: unknown) => {
        if (body === undefined) return body;
        if (body instanceof CursorPage) return { data: body.items, meta: body.meta };
        return { data: body };
      }),
    );
  }
}
