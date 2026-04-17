import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../../products/products.service';
import { UsersService } from '../../users.service';
import { MyProductsQueryDto } from './dto/my-products-query.dto';

@Injectable()
export class MyProductsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  async getMyProducts(currentUser: RequestUser, query: MyProductsQueryDto) {
    await this.usersService.findByIdOrThrow(currentUser.id);

    const [items, total] = await this.productsService.repository.findAndCount({
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        createdAt: true,
      },
      where: { sellerId: currentUser.id },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items: items.map((product) => ({
        id: Number(product.id),
        title: product.title,
        price: product.price,
        status: product.status,
        createdAt: product.createdAt,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  }
}
