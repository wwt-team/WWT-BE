import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3UploadService } from '../../common/services/s3-upload.service';
import { ProductsModule } from '../products/products.module';
import { User } from './entities/user.entity';
import { MeService } from './features/me/me.service';
import { UploadProfileImageService } from './features/me/upload-profile-image.service';
import { UpdateMeService } from './features/me/update-me.service';
import { MyProductsService } from './features/my-products/my-products.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ProductsModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    MeService,
    UpdateMeService,
    UploadProfileImageService,
    MyProductsService,
    S3UploadService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
