import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ProductStatus } from '../../../products/entities/product.entity';
import { TradeRequestStatus } from '../../entities/trade-request.entity';
import { AcceptTradeRequestService } from './accept-trade-request.service';

describe('AcceptTradeRequestService', () => {
  const productsService = {
    updateProductStatus: jest.fn(),
  };
  const tradeRequestsService = {
    findTradeRequestOrThrow: jest.fn(),
    assertPending: jest.fn(),
    save: jest.fn(),
  };

  const service = new AcceptTradeRequestService(
    productsService as never,
    tradeRequestsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-seller acceptance', async () => {
    tradeRequestsService.findTradeRequestOrThrow.mockResolvedValue({
      sellerId: '10',
      product: { id: '1' },
    });

    await expect(
      service.accept('1', { id: '20', email: 'buyer@example.com' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
        message: '거래 요청을 수락할 권한이 없습니다.',
      },
    });
  });

  it('accepts a pending request and reserves the product', async () => {
    const updatedAt = new Date('2026-04-19T00:00:00.000Z');
    const tradeRequest = {
      id: '1',
      sellerId: '10',
      status: TradeRequestStatus.PENDING,
      product: { id: '3', status: ProductStatus.ON_SALE },
    };

    tradeRequestsService.findTradeRequestOrThrow.mockResolvedValue(tradeRequest);
    tradeRequestsService.save.mockResolvedValue({
      ...tradeRequest,
      status: TradeRequestStatus.ACCEPTED,
      updatedAt,
    });

    await expect(
      service.accept('1', { id: '10', email: 'seller@example.com' }),
    ).resolves.toEqual({
      id: 1,
      status: TradeRequestStatus.ACCEPTED,
      product: {
        id: 3,
        status: ProductStatus.RESERVED,
      },
      updatedAt,
    });

    expect(tradeRequestsService.assertPending).toHaveBeenCalledWith(
      tradeRequest,
      'PENDING 상태의 거래 요청만 수락할 수 있습니다.',
    );
    expect(productsService.updateProductStatus).toHaveBeenCalledWith(
      tradeRequest.product,
      ProductStatus.RESERVED,
    );
  });
});
