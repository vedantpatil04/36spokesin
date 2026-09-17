import { applyDecorators, type Type } from "@nestjs/common";
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";

export class ApiErrorDetailDto {
  @ApiProperty({ example: "email" })
  field!: string;

  @ApiProperty({ type: [String], example: ["email must be an email"] })
  messages!: string[];
}

export class ApiErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "VALIDATION_FAILED" })
  code!: string;

  @ApiProperty({ example: "Request validation failed." })
  message!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];

  @ApiPropertyOptional({ example: "5f0c7d8e-7a36-4a6a-9c0e-2f6f4f2a9b1d" })
  requestId?: string;

  @ApiProperty({ example: "/api/v1/auth/register" })
  path!: string;

  @ApiProperty({ format: "date-time" })
  timestamp!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto;
}

interface DataResponseOptions {
  status?: number;
  description?: string;
  isArray?: boolean;
  paginated?: boolean;
}

/** Documents the `{ data }` / `{ data, meta }` success envelope around `model`. */
export function ApiDataResponse(model: Type<unknown>, options: DataResponseOptions = {}) {
  const { status = 200, description, isArray = false, paginated = false } = options;
  const item = { $ref: getSchemaPath(model) };
  const data = isArray || paginated ? { type: "array", items: item } : item;
  const properties: Record<string, object> = { data };
  if (paginated) {
    properties["meta"] = {
      type: "object",
      properties: {
        nextCursor: { type: "string", format: "uuid", nullable: true },
        limit: { type: "integer", example: 20 },
      },
      required: ["nextCursor", "limit"],
    };
  }

  return applyDecorators(
    ApiExtraModels(model),
    ApiResponse({
      status,
      ...(description ? { description } : {}),
      schema: { type: "object", properties, required: Object.keys(properties) },
    }),
  );
}

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: "Validation failed",
  401: "Missing, invalid or expired credentials",
  403: "Authenticated but not allowed",
  404: "Not found",
  409: "Conflict",
  422: "Request understood but cannot be processed",
  429: "Too many requests",
  503: "Dependency unavailable",
};

/** Documents the standard error body for the given status codes. */
export function ApiErrorResponses(...statuses: number[]) {
  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: ERROR_DESCRIPTIONS[status] ?? "Error",
        type: ApiErrorResponseDto,
      }),
    ),
  );
}
