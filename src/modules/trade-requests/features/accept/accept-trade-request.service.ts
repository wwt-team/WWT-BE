import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductStatus } from '../../../products/entities/product.entity';
import { ProductsService } from '../../../products/products.service';
import { TradeRequestStatus } from '../../entities/trade-request.entity';
import { TradeRequestsService } from '../../trade-requests.service';

@Injectable()
export class AcceptTradeRequestService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tradeRequestsService: TradeRequestsService,
  ) {}

  async accept(tradeRequestId: string, user: RequestUser) {
    const tradeRequest =
      await this.tradeRequestsService.findTradeRequestOrThrow(tradeRequestId);

    if (String(tradeRequest.sellerId) !== String(user.id)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        '거래 요청을 수락할 권한이 없습니다.',
      );
    }

    this.tradeRequestsService.assertPending(
      tradeRequest,
      'PENDING 상태의 거래 요청만 수락할 수 있습니다.',
    );

    tradeRequest.status = TradeRequestStatus.ACCEPTED;
    const updatedTradeRequest = await this.tradeRequestsService.save(tradeRequest);
    await this.productsService.updateProductStatus(
      tradeRequest.product,
      ProductStatus.RESERVED,
    );

    return {
      id: Number(updatedTradeRequest.id),
      status: updatedTradeRequest.status,
      product: {
        id: Number(tradeRequest.product.id),
        status: ProductStatus.RESERVED,
      },
      updatedAt: updatedTradeRequest.updatedAt,
    };
  }
}
