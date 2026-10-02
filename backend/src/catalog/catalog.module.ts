import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module.js";
import { AdminProductsController } from "./admin-products.controller.js";
import { AdminProductsService } from "./admin-products.service.js";
import { AdminTaxonomyController } from "./admin-taxonomy.controller.js";
import { CatalogController } from "./catalog.controller.js";
import { CatalogMapper } from "./catalog.mapper.js";
import { ProductImagesService } from "./product-images.service.js";
import { ProductsService } from "./products.service.js";
import { TaxonomyService } from "./taxonomy.service.js";

/** Shop catalogue: storefront reads and the admin CMS for products, images, categories, brands. */
@Module({
  imports: [MediaModule],
  controllers: [CatalogController, AdminProductsController, AdminTaxonomyController],
  providers: [
    CatalogMapper,
    ProductsService,
    TaxonomyService,
    AdminProductsService,
    ProductImagesService,
  ],
  exports: [CatalogMapper],
})
export class CatalogModule {}
