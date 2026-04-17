import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../../products/products.service';
import { TradeRequestsService } from '../../trade-requests.service';
import { TradeRequestListQueryDto } from './dto/trade-request-list-query.dto';

@Injectable()
export class ListProductTradeRequestsService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tradeRequestsService: TradeRequestsService,
  ) {}

  async list(productId: string, user: RequestUser, query: TradeRequestListQueryDto) {
    const product = await this.productsService.findProductOrThrow(productId);

    if (String(product.sellerId) !== String(user.id)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        '거래 요청 목록을 조회할 권한이 없습니다.',
      );
    }

    const [items, total] = await this.tradeRequestsService.repository.findAndCount({
      where: { productId: product.id },
      relations: { buyer: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items: items.map((tradeRequest) => ({
        id: Number(tradeRequest.id),
        productId: Number(tradeRequest.productId),
        buyer: {
          id: Number(tradeRequest.buyer.id),
          nickname: tradeRequest.buyer.nickname,
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
