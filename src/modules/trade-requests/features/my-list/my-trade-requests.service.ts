import { Injectable } from '@nestjs/common';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { TradeRequestsService } from '../../trade-requests.service';
import { MyTradeRequestsQueryDto } from './dto/my-trade-requests-query.dto';

@Injectable()
export class MyTradeRequestsService {
  constructor(private readonly tradeRequestsService: TradeRequestsService) {}

  async list(user: RequestUser, query: MyTradeRequestsQueryDto) {
    const [items, total] = await this.tradeRequestsService.repository.findAndCount({
      where: { buyerId: user.id },
      relations: { product: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items: items.map((tradeRequest) => ({
        id: Number(tradeRequest.id),
        product: {
          id: Number(tradeRequest.product.id),
          title: tradeRequest.product.title,
          price: tradeRequest.product.price,
          status: tradeRequest.product.status,
        },
        message: tradeRequest.message,
        status: tradeRequest.status,
        createdAt: tradeRequest.createdAt,
      })),
      page: query.page,
      limit: query.limit,
      total,
    };
  }
}
