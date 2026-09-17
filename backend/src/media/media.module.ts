import { Module } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service.js";
import { MediaController } from "./media.controller.js";
import { MediaService } from "./media.service.js";
import { MEDIA_PROCESSOR, NoopMediaProcessor } from "./processing/media-processor.js";
import { OBJECT_STORAGE, type ObjectStorage } from "./storage/object-storage.js";
import { R2ObjectStorage } from "./storage/r2-object-storage.js";
import { UnconfiguredObjectStorage } from "./storage/unconfigured-object-storage.js";

@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: OBJECT_STORAGE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): ObjectStorage =>
        config.storage ? new R2ObjectStorage(config.storage) : new UnconfiguredObjectStorage(),
    },
    { provide: MEDIA_PROCESSOR, useClass: NoopMediaProcessor },
  ],
  exports: [MediaService],
})
export class MediaModule {}
