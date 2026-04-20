import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../products.service';
import { UpdateProductImagesDto } from './dto/update-product-images.dto';

@Injectable()
export class UpdateProductImagesService {
  constructor(private readonly productsService: ProductsService) {}

  async updateImages(
    productId: string,
    dto: UpdateProductImagesDto,
    user: RequestUser,
  ) {
    const product = await this.productsService.findProductOrThrow(productId);

    this.productsService.assertSeller(
      product,
      user.id,
      '상품 이미지를 수정할 권한이 없습니다.',
    );

    product.imageUrls = dto.imageUrls;

    const updatedProduct = await this.productsService.save(product);

    return {
      id: Number(updatedProduct.id),
      imageUrls: updatedProduct.imageUrls,
      updatedAt: updatedProduct.updatedAt,
    };
  }
}
