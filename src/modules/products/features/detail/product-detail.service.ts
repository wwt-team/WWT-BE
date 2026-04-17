import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../products.service';

@Injectable()
export class ProductDetailService {
  constructor(private readonly productsService: ProductsService) {}

  async detail(productId: string) {
    const product = await this.productsService.findProductOrThrow(productId, {
      seller: true,
    });

    return {
      id: Number(product.id),
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrls: product.imageUrls,
      status: product.status,
      seller: {
        id: Number(product.seller.id),
        nickname: product.seller.nickname,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
