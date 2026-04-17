import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { ProductsService } from '../../products.service';
import { ProductSearchQueryDto } from './dto/product-search-query.dto';

@Injectable()
export class ProductSearchService {
  constructor(private readonly productsService: ProductsService) {}

  async search(query: ProductSearchQueryDto) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_SEARCH_PRICE_RANGE,
        'minPrice는 maxPrice보다 클 수 없습니다.',
      );
    }

    const builder = this.productsService.repository
      .createQueryBuilder('product')
      .select(['product.id', 'product.title', 'product.price'])
      .orderBy('product.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.keyword) {
      builder.andWhere('product.title ILIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    if (query.status) {
      builder.andWhere('product.status = :status', { status: query.status });
    }

    if (query.minPrice !== undefined) {
      builder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      builder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    const [items, total] = await builder.getManyAndCount();

    return {
      items: items.map((product) => ({
        id: Number(product.id),
        title: product.title,
        price: product.price,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  }
}
