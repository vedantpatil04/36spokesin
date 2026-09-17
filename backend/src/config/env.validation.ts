import "reflect-metadata";
import { plainToInstance, Transform } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from "class-validator";

export enum NodeEnv {
  Development = "development",
  Test = "test",
  Production = "production",
}

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
const SAME_SITE_VALUES = ["lax", "strict", "none"] as const;

type RawParams = { obj: Record<string, unknown>; key: string };

// Transforms read the raw value (obj[key]): implicit conversion has already run on
// `value`, and Boolean("false") is true.
const toBoolean = ({ obj, key }: RawParams): unknown => {
  const raw = obj[key];
  if (typeof raw !== "string") return raw;
  const normalised = raw.trim().toLowerCase();
  if (normalised === "") return undefined;
  if (["true", "1", "yes"].includes(normalised)) return true;
  if (["false", "0", "no"].includes(normalised)) return false;
  return raw;
};

const emptyToUndefined = ({ obj, key }: RawParams): unknown => {
  const raw = obj[key];
  return typeof raw === "string" && raw.trim() === "" ? undefined : raw;
};

const URL_OPTIONS = { require_tld: false, require_protocol: true } as const;

/**
 * Every environment variable the API reads. Validated once at startup: the
 * process refuses to boot with missing or malformed configuration.
 * See .env.example for descriptions.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  API_URL?: string;

  @IsUrl(URL_OPTIONS)
  WEB_URL: string = "http://localhost:8080";

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  TRUST_PROXY?: string;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  JWT_ACCESS_TTL_SECONDS: number = 900;

  @IsInt()
  @Min(1)
  @Max(180)
  REFRESH_TOKEN_TTL_DAYS: number = 30;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  AUTH_COOKIE_DOMAIN?: string;

  @IsIn(SAME_SITE_VALUES)
  AUTH_COOKIE_SAMESITE: (typeof SAME_SITE_VALUES)[number] = "lax";

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  AUTH_COOKIE_SECURE?: boolean;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  R2_ACCOUNT_ID?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  R2_ACCESS_KEY_ID?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  R2_SECRET_ACCESS_KEY?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  R2_BUCKET_NAME?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  R2_PUBLIC_BASE_URL?: string;

  /** Overrides the R2 endpoint, e.g. a local S3-compatible emulator. */
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl(URL_OPTIONS)
  R2_ENDPOINT?: string;

  @IsInt()
  @Min(1024)
  @Max(100 * 1024 * 1024)
  MEDIA_MAX_UPLOAD_BYTES: number = 10 * 1024 * 1024;

  @IsInt()
  @Min(60)
  @Max(3600)
  MEDIA_UPLOAD_URL_TTL_SECONDS: number = 600;

  @Transform(toBoolean)
  @IsBoolean()
  RATE_LIMIT_ENABLED: boolean = true;

  @IsInt()
  @Min(1)
  RATE_LIMIT_TTL_SECONDS: number = 60;

  @IsInt()
  @Min(1)
  RATE_LIMIT_MAX: number = 120;

  @IsInt()
  @Min(1)
  RATE_LIMIT_AUTH_MAX: number = 10;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(LOG_LEVELS)
  LOG_LEVEL?: (typeof LOG_LEVELS)[number];

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  SWAGGER_ENABLED?: boolean;
}

const R2_REQUIRED_KEYS = [
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const satisfies readonly (keyof EnvironmentVariables)[];

function crossFieldErrors(env: EnvironmentVariables): string[] {
  const errors: string[] = [];

  if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    errors.push("JWT_SECRET and JWT_REFRESH_SECRET must be different values");
  }

  const r2Values = [...R2_REQUIRED_KEYS, "R2_ACCOUNT_ID", "R2_ENDPOINT"] as const;
  const anyR2 = r2Values.some((key) => env[key] !== undefined);
  if (anyR2) {
    const missing: string[] = R2_REQUIRED_KEYS.filter((key) => env[key] === undefined);
    if (!env.R2_ACCOUNT_ID && !env.R2_ENDPOINT) missing.push("R2_ACCOUNT_ID (or R2_ENDPOINT)");
    if (missing.length > 0) {
      errors.push(`Media storage is partially configured. Missing: ${missing.join(", ")}`);
    }
  }

  if (env.NODE_ENV === NodeEnv.Production) {
    const origins = (env.CORS_ORIGINS ?? "").split(",").map((origin) => origin.trim());
    if (origins.includes("*")) errors.push("CORS_ORIGINS must not contain * in production");
    if (env.AUTH_COOKIE_SECURE === false) {
      errors.push("AUTH_COOKIE_SECURE cannot be false in production");
    }
  }

  if (env.AUTH_COOKIE_SAMESITE === "none" && env.AUTH_COOKIE_SECURE === false) {
    errors.push("AUTH_COOKIE_SAMESITE=none requires secure cookies");
  }

  return errors;
}

/** Used by ConfigModule. Throws a readable error listing every problem at once. */
export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const fieldErrors = validateSync(env, { skipMissingProperties: false }).flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );
  const errors = [...fieldErrors, ...(fieldErrors.length === 0 ? crossFieldErrors(env) : [])];

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n  - ${errors.join("\n  - ")}`);
  }
  return env;
}
