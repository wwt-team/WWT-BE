import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../products.service';

@Injectable()
export class DeleteProductService {
  constructor(private readonly productsService: ProductsService) {}

  async delete(productId: string, user: RequestUser) {
    const product = await this.productsService.findProductOrThrow(productId);

    this.productsService.assertSeller(
      product,
      user.id,
      '상품을 삭제할 권한이 없습니다.',
    );

    await this.productsService.repository.delete(product.id);
  }
}
