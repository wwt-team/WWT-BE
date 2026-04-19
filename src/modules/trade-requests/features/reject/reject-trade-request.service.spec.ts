import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { TradeRequestStatus } from '../../entities/trade-request.entity';
import { RejectTradeRequestService } from './reject-trade-request.service';

describe('RejectTradeRequestService', () => {
  const tradeRequestsService = {
    findTradeRequestOrThrow: jest.fn(),
    assertPending: jest.fn(),
    save: jest.fn(),
  };

  const service = new RejectTradeRequestService(tradeRequestsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks non-seller rejection', async () => {
    tradeRequestsService.findTradeRequestOrThrow.mockResolvedValue({
      sellerId: '10',
    });

    await expect(
      service.reject('1', { id: '20', email: 'buyer@example.com' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN,
        message: '거래 요청을 거절할 권한이 없습니다.',
      },
    });
  });

  it('rejects a pending trade request', async () => {
    const updatedAt = new Date('2026-04-19T00:00:00.000Z');
    const tradeRequest = {
      id: '1',
      sellerId: '10',
      status: TradeRequestStatus.PENDING,
    };

    tradeRequestsService.findTradeRequestOrThrow.mockResolvedValue(tradeRequest);
    tradeRequestsService.save.mockResolvedValue({
      ...tradeRequest,
      status: TradeRequestStatus.REJECTED,
      updatedAt,
    });

    await expect(
      service.reject('1', { id: '10', email: 'seller@example.com' }),
    ).resolves.toEqual({
      id: 1,
      status: TradeRequestStatus.REJECTED,
      updatedAt,
    });

    expect(tradeRequestsService.assertPending).toHaveBeenCalledWith(
      tradeRequest,
      'PENDING 상태의 거래 요청만 거절할 수 있습니다.',
    );
  });
});
