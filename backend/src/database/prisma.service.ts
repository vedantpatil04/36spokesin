import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { AppConfigService } from "../config/app-config.service.js";
import { PrismaClient } from "../generated/prisma/client.js";

/** The application's single Prisma client, backed by a node-postgres pool. */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: AppConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.database.url }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Database client initialised");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** True when a trivial query succeeds within `timeoutMs`. Never throws. */
  async isHealthy(timeoutMs = 2000): Promise<boolean> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });
    const probe = this.$queryRaw`SELECT 1`.then(
      () => true,
      (error: unknown) => {
        this.logger.error({ err: error }, "Database health check failed");
        return false;
      },
    );
    try {
      return await Promise.race([probe, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
