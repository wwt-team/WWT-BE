import { Injectable } from '@nestjs/common';
import { ProductsService } from '../../products.service';
import { ProductListQueryDto } from './dto/product-list-query.dto';

@Injectable()
export class ProductListService {
  constructor(private readonly productsService: ProductsService) {}

  async list(query: ProductListQueryDto) {
    const [items, total] = await this.productsService.repository.findAndCount({
      select: { id: true, title: true, price: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

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
