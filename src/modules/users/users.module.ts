import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { User } from './entities/user.entity';
import { MeService } from './features/me/me.service';
import { UpdateMeService } from './features/me/update-me.service';
import { MyProductsService } from './features/my-products/my-products.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ProductsModule],
  controllers: [UsersController],
  providers: [UsersService, MeService, UpdateMeService, MyProductsService],
  exports: [UsersService],
})
export class UsersModule {}
