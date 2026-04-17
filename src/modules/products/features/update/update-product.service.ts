import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../products.service';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class UpdateProductService {
  constructor(private readonly productsService: ProductsService) {}

  async update(productId: string, dto: UpdateProductDto, user: RequestUser) {
    const product = await this.productsService.findProductOrThrow(productId);

    this.productsService.assertSeller(
      product,
      user.id,
      '상품을 수정할 권한이 없습니다.',
    );

    if (dto.title !== undefined) product.title = dto.title;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.imageUrls !== undefined) product.imageUrls = dto.imageUrls;

    const updatedProduct = await this.productsService.save(product);

    return {
      id: Number(updatedProduct.id),
      title: updatedProduct.title,
      description: updatedProduct.description,
      price: updatedProduct.price,
      imageUrls: updatedProduct.imageUrls,
      status: updatedProduct.status,
      sellerId: Number(updatedProduct.sellerId),
      updatedAt: updatedProduct.updatedAt,
    };
  }
}
