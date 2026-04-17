import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../products.service';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@Injectable()
export class UpdateProductStatusService {
  constructor(private readonly productsService: ProductsService) {}

  async updateStatus(
    productId: string,
    dto: UpdateProductStatusDto,
    user: RequestUser,
  ) {
    const product = await this.productsService.findProductOrThrow(productId);

    this.productsService.assertSeller(
      product,
      user.id,
      '상품 상태를 변경할 권한이 없습니다.',
    );

    const updatedProduct = await this.productsService.updateProductStatus(
      product,
      dto.status,
    );

    return {
      id: Number(updatedProduct.id),
      status: updatedProduct.status,
      updatedAt: updatedProduct.updatedAt,
    };
  }
}
