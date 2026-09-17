import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NodeEnv, type EnvironmentVariables } from "./env.validation.js";

export type CookieSameSite = "lax" | "strict" | "none";

export interface StorageConfig {
  accountId: string | null;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

/**
 * Typed, grouped view of the validated environment. Inject this instead of
 * reading process.env anywhere in the application.
 */
@Injectable()
export class AppConfigService {
  readonly app: {
    env: NodeEnv;
    isProduction: boolean;
    isTest: boolean;
    port: number;
    apiUrl: string;
    webUrl: string;
    corsOrigins: readonly string[];
    trustProxy: boolean | number | string;
  };

  readonly database: { url: string };

  readonly auth: {
    jwtSecret: string;
    refreshTokenSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlDays: number;
    cookie: { domain: string | undefined; sameSite: CookieSameSite; secure: boolean };
  };

  /** Null when object storage is not configured; media endpoints then return 503. */
  readonly storage: StorageConfig | null;

  readonly media: { maxUploadBytes: number; uploadUrlTtlSeconds: number };

  readonly rateLimit: { enabled: boolean; ttlSeconds: number; max: number; authMax: number };

  readonly logging: { level: string; pretty: boolean };

  readonly docs: { enabled: boolean };

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    const get = <K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] =>
      config.get(key, { infer: true });

    const env = get("NODE_ENV");
    const isProduction = env === NodeEnv.Production;
    const port = get("PORT");
    const webUrl = stripTrailingSlash(get("WEB_URL"));
    const corsOrigins = (get("CORS_ORIGINS") ?? webUrl)
      .split(",")
      .map((origin) => stripTrailingSlash(origin.trim()))
      .filter(Boolean);

    this.app = {
      env,
      isProduction,
      isTest: env === NodeEnv.Test,
      port,
      apiUrl: stripTrailingSlash(get("API_URL") ?? `http://localhost:${port}`),
      webUrl,
      corsOrigins,
      trustProxy: parseTrustProxy(get("TRUST_PROXY")),
    };

    this.database = { url: get("DATABASE_URL") };

    this.auth = {
      jwtSecret: get("JWT_SECRET"),
      refreshTokenSecret: get("JWT_REFRESH_SECRET"),
      accessTokenTtlSeconds: get("JWT_ACCESS_TTL_SECONDS"),
      refreshTokenTtlDays: get("REFRESH_TOKEN_TTL_DAYS"),
      cookie: {
        domain: get("AUTH_COOKIE_DOMAIN"),
        sameSite: get("AUTH_COOKIE_SAMESITE"),
        secure: get("AUTH_COOKIE_SECURE") ?? isProduction,
      },
    };

    const bucket = get("R2_BUCKET_NAME");
    const accessKeyId = get("R2_ACCESS_KEY_ID");
    const secretAccessKey = get("R2_SECRET_ACCESS_KEY");
    const publicBaseUrl = get("R2_PUBLIC_BASE_URL");
    const accountId = get("R2_ACCOUNT_ID") ?? null;
    const endpoint =
      get("R2_ENDPOINT") ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);

    this.storage =
      bucket && accessKeyId && secretAccessKey && publicBaseUrl && endpoint
        ? {
            accountId,
            endpoint,
            accessKeyId,
            secretAccessKey,
            bucket,
            publicBaseUrl: stripTrailingSlash(publicBaseUrl),
          }
        : null;

    this.media = {
      maxUploadBytes: get("MEDIA_MAX_UPLOAD_BYTES"),
      uploadUrlTtlSeconds: get("MEDIA_UPLOAD_URL_TTL_SECONDS"),
    };

    this.rateLimit = {
      enabled: get("RATE_LIMIT_ENABLED"),
      ttlSeconds: get("RATE_LIMIT_TTL_SECONDS"),
      max: get("RATE_LIMIT_MAX"),
      authMax: get("RATE_LIMIT_AUTH_MAX"),
    };

    this.logging = {
      level:
        get("LOG_LEVEL") ?? (isProduction ? "info" : env === NodeEnv.Test ? "silent" : "debug"),
      pretty: env === NodeEnv.Development,
    };

    this.docs = { enabled: get("SWAGGER_ENABLED") ?? !isProduction };
  }
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Mirrors Express's "trust proxy" setting: false, true, a hop count, or an address list. */
function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
}
