import { VersioningType } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { REFRESH_COOKIE_NAME } from "./auth/auth.constants.js";
import { AppConfigService } from "./config/app-config.service.js";

/** No endpoint accepts files or large documents; uploads go straight to object storage. */
export const REQUEST_BODY_LIMIT = "100kb";

export const API_PREFIX = "api";
export const DOCS_PATH = "api/docs";

/**
 * HTTP-level configuration shared by the real server and the e2e tests, so tests
 * exercise the same prefix, versioning, CORS, cookies and body limits.
 * The application must be created with `{ bodyParser: false }`.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);

  app.useLogger(app.get(Logger));
  app.set("trust proxy", config.app.trustProxy);

  app.use(helmet());
  app.use(cookieParser());
  app.useBodyParser("json", { limit: REQUEST_BODY_LIMIT });

  const allowedOrigins = new Set(config.app.corsOrigins);
  app.enableCors({
    // Requests without an Origin (curl, server-to-server, native apps) are not
    // subject to CORS. Browser origins must be listed explicitly.
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id", "X-Client-Platform"],
    exposedHeaders: ["X-Request-Id"],
    maxAge: 600,
  });

  app.setGlobalPrefix(API_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.enableShutdownHooks();
}

export function setupSwagger(app: NestExpressApplication): void {
  const config = app.get(AppConfigService);
  const document = new DocumentBuilder()
    .setTitle("36 Spokes API")
    .setDescription(
      "REST API for the 36 Spokes platform. Successful responses are wrapped as `{ data }` " +
        "(lists: `{ data, meta }`); errors as `{ error: { statusCode, code, message, details?, requestId } }`.",
    )
    .setVersion("1")
    .addServer(config.app.apiUrl)
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .addCookieAuth(REFRESH_COOKIE_NAME)
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () => SwaggerModule.createDocument(app, document), {
    jsonDocumentUrl: `${DOCS_PATH}/openapi.json`,
    swaggerOptions: { persistAuthorization: true },
  });
}
