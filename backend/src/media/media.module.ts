import { Module } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service.js";
import { AdminMediaController } from "./admin-media.controller.js";
import { MediaLibraryService } from "./media-library.service.js";
import { MediaController } from "./media.controller.js";
import { MediaService } from "./media.service.js";
import { MEDIA_PROCESSOR, NoopMediaProcessor } from "./processing/media-processor.js";
import { CloudinaryObjectStorage } from "./storage/cloudinary-object-storage.js";
import { OBJECT_STORAGE, type ObjectStorage } from "./storage/object-storage.js";
import { R2ObjectStorage } from "./storage/r2-object-storage.js";
import { UnconfiguredObjectStorage } from "./storage/unconfigured-object-storage.js";

@Module({
  controllers: [MediaController, AdminMediaController],
  providers: [
    MediaService,
    MediaLibraryService,
    {
      provide: OBJECT_STORAGE,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): ObjectStorage => {
        if (config.mediaProvider === "cloudinary" && config.cloudinary) {
          return new CloudinaryObjectStorage(config.cloudinary, config.app.apiUrl);
        }
        if (config.mediaProvider === "r2" && config.storage) {
          return new R2ObjectStorage(config.storage);
        }
        return new UnconfiguredObjectStorage();
      },
    },
    { provide: MEDIA_PROCESSOR, useClass: NoopMediaProcessor },
  ],
  exports: [MediaService],
})
export class MediaModule {}
