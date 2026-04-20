import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductStatus } from '../../entities/product.entity';
import { ProductsService } from '../../products.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class CreateProductService {
  constructor(private readonly productsService: ProductsService) {}

  async create(dto: CreateProductDto, user: RequestUser) {
    const product = await this.productsService.create({
      sellerId: user.id,
      title: dto.title,
      description: dto.description ?? null,
      price: dto.price,
      imageUrls: dto.imageUrls ?? [],
      status: ProductStatus.ON_SALE,
    });

    return {
      id: Number(product.id),
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrls: product.imageUrls,
      status: product.status,
      sellerId: Number(product.sellerId),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  } 
}
