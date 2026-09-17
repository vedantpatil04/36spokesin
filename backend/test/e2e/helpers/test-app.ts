import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../../src/app.module.js";
import { configureApp } from "../../../src/app.setup.js";
import { PrismaService } from "../../../src/database/prisma.service.js";
import { OBJECT_STORAGE, type ObjectStorage } from "../../../src/media/storage/object-storage.js";

export const API = "/api/v1";

export type Http = ReturnType<typeof request>;

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  http: Http;
}

/**
 * Boots the full application with the same HTTP configuration as production.
 * Pass `storage` to replace R2; omit it to run with storage unconfigured.
 */
export async function createTestApp(
  options: { storage?: ObjectStorage } = {},
): Promise<TestContext> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.storage) builder = builder.overrideProvider(OBJECT_STORAGE).useValue(options.storage);

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bodyParser: false });
  configureApp(app);
  await app.init();

  return { app, prisma: app.get(PrismaService), http: request(app.getHttpServer()) };
}

/** Empties every application table. The migrations table is untouched. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "auth_sessions", "rider_profiles", "media_assets", "users" CASCADE',
  );
}
