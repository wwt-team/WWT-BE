import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3UploadService } from '../../common/services/s3-upload.service';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { CreateProductService } from './features/create/create-product.service';
import { DeleteProductService } from './features/delete/delete-product.service';
import { ProductDetailService } from './features/detail/product-detail.service';
import { ProductListService } from './features/list/product-list.service';
import { ProductSearchService } from './features/search/product-search.service';
import { UpdateProductStatusService } from './features/status/update-product-status.service';
import { UploadProductImagesService } from './features/update/upload-product-images.service';
import { UpdateProductImagesService } from './features/update/update-product-images.service';
import { UpdateProductService } from './features/update/update-product.service';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductListService,
    ProductSearchService,
    ProductDetailService,
    CreateProductService,
    UpdateProductService,
    UpdateProductImagesService,
    UploadProductImagesService,
    DeleteProductService,
    UpdateProductStatusService,
    S3UploadService,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
