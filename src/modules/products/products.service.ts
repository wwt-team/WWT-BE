import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { Product, ProductStatus } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  create(input: Partial<Product>) {
    const product = this.productsRepository.create(input);
    return this.productsRepository.save(product);
  }

  save(product: Product) {
    return this.productsRepository.save(product);
  }

  async findProductOrThrow(
    productId: string,
    relations?: FindOptionsRelations<Product>,
  ) {
    const product = await this.productsRepository.findOne({
      where: { id: String(productId) },
      relations,
    });

    if (!product) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.PRODUCT_NOT_FOUND,
        '상품을 찾을 수 없습니다.',
      );
    }

    return product;
  }

  assertSeller(product: Product, userId: string, message: string) {
    if (String(product.sellerId) !== String(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, message);
    }
  }

  async updateProductStatus(product: Product, status: ProductStatus) {
    product.status = status;
    return this.productsRepository.save(product);
  }

  get repository() {
    return this.productsRepository;
  }
}
