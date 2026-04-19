import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ProductStatus } from '../../../products/entities/product.entity';
import { TradeRequestStatus } from '../../entities/trade-request.entity';
import { CreateTradeRequestService } from './create-trade-request.service';

describe('CreateTradeRequestService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
  };
  const tradeRequestsService = {
    repository: {
      findOne: jest.fn(),
    },
    create: jest.fn(),
  };

  const service = new CreateTradeRequestService(
    productsService as never,
    tradeRequestsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects self trade requests', async () => {
    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
      status: ProductStatus.ON_SALE,
    });

    await expect(
      service.create('1', {} as never, { id: '10', email: 'seller@example.com' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.CONFLICT,
        code: ERROR_CODES.SELF_TRADE_NOT_ALLOWED,
        message: '자신의 상품에는 거래 요청할 수 없습니다.',
      },
    });
  });

  it('rejects requests for sold products', async () => {
    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
      status: ProductStatus.SOLD,
    });

    await expect(
      service.create('1', {} as never, { id: '20', email: 'buyer@example.com' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.CONFLICT,
        code: ERROR_CODES.PRODUCT_ALREADY_SOLD,
        message: '판매 완료된 상품입니다.',
      },
    });
  });

  it('rejects duplicate pending requests', async () => {
    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
      status: ProductStatus.ON_SALE,
    });
    tradeRequestsService.repository.findOne.mockResolvedValue({ id: '99' });

    await expect(
      service.create('1', {} as never, { id: '20', email: 'buyer@example.com' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.CONFLICT,
        code: ERROR_CODES.DUPLICATE_PENDING_TRADE_REQUEST,
        message: '이미 대기 중인 거래 요청이 있습니다.',
      },
    });
  });

  it('creates a pending trade request in documented shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');

    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
      status: ProductStatus.ON_SALE,
    });
    tradeRequestsService.repository.findOne.mockResolvedValue(null);
    tradeRequestsService.create.mockResolvedValue({
      id: '5',
      productId: '1',
      buyerId: '20',
      sellerId: '10',
      message: '구매 원합니다.',
      status: TradeRequestStatus.PENDING,
      createdAt,
    });

    await expect(
      service.create(
        '1',
        { message: '구매 원합니다.' } as never,
        { id: '20', email: 'buyer@example.com' },
      ),
    ).resolves.toEqual({
      id: 5,
      productId: 1,
      buyerId: 20,
      sellerId: 10,
      message: '구매 원합니다.',
      status: TradeRequestStatus.PENDING,
      createdAt,
    });
  });
});
