import { setDefaultResultOrder } from "node:dns";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "nestjs-pino";

setDefaultResultOrder("ipv4first");
import { AppModule } from "./app.module.js";
import { DOCS_PATH, configureApp, setupSwagger } from "./app.setup.js";
import { AppConfigService } from "./config/app-config.service.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  configureApp(app);

  const config = app.get(AppConfigService);
  if (config.docs.enabled) setupSwagger(app);

  await app.listen(config.app.port);

  const logger = app.get(Logger);
  logger.log(`36 Spokes API listening on port ${config.app.port} (${config.app.env})`, "Bootstrap");
  if (config.docs.enabled) logger.log(`API docs at ${config.app.apiUrl}/${DOCS_PATH}`, "Bootstrap");
  if (!config.mediaProvider) {
    logger.warn("Media storage is not configured: media endpoints will return 503", "Bootstrap");
  } else {
    logger.log(`Media storage provider: ${config.mediaProvider}`, "Bootstrap");
  }
}

bootstrap().catch((error: unknown) => {
  console.error("API failed to start:", error instanceof Error ? error.message : error);
  process.exit(1);
});
