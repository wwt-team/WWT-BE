import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductStatus } from '../../../products/entities/product.entity';
import { ProductsService } from '../../../products/products.service';
import { TradeRequestStatus } from '../../entities/trade-request.entity';
import { TradeRequestsService } from '../../trade-requests.service';
import { CreateTradeRequestDto } from './dto/create-trade-request.dto';

@Injectable()
export class CreateTradeRequestService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tradeRequestsService: TradeRequestsService,
  ) {}

  async create(
    productId: string,
    dto: CreateTradeRequestDto,
    user: RequestUser,
  ) {
    const product = await this.productsService.findProductOrThrow(productId);

    if (String(product.sellerId) === String(user.id)) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.SELF_TRADE_NOT_ALLOWED,
        '자신의 상품에는 거래 요청할 수 없습니다.',
      );
    }

    if (product.status === ProductStatus.SOLD) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.PRODUCT_ALREADY_SOLD,
        '판매 완료된 상품입니다.',
      );
    }

    const existingTradeRequest =
      await this.tradeRequestsService.repository.findOne({
        where: {
          productId: product.id,
          buyerId: user.id,
          status: TradeRequestStatus.PENDING,
        },
      });

    if (existingTradeRequest) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.DUPLICATE_PENDING_TRADE_REQUEST,
        '이미 대기 중인 거래 요청이 있습니다.',
      );
    }

    const tradeRequest = await this.tradeRequestsService.create({
      productId: product.id,
      buyerId: user.id,
      sellerId: product.sellerId,
      message: dto.message ?? null,
      status: TradeRequestStatus.PENDING,
    });

    return {
      id: Number(tradeRequest.id),
      productId: Number(tradeRequest.productId),
      buyerId: Number(tradeRequest.buyerId),
      sellerId: Number(tradeRequest.sellerId),
      message: tradeRequest.message,
      status: tradeRequest.status,
      createdAt: tradeRequest.createdAt,
    };
  }
}
