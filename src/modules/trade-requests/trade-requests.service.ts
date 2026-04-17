import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { TradeRequest, TradeRequestStatus } from './entities/trade-request.entity';

@Injectable()
export class TradeRequestsService {
  constructor(
    @InjectRepository(TradeRequest)
    private readonly tradeRequestsRepository: Repository<TradeRequest>,
  ) {}

  create(input: Partial<TradeRequest>) {
    const tradeRequest = this.tradeRequestsRepository.create(input);
    return this.tradeRequestsRepository.save(tradeRequest);
  }

  save(tradeRequest: TradeRequest) {
    return this.tradeRequestsRepository.save(tradeRequest);
  }

  async findTradeRequestOrThrow(tradeRequestId: string) {
    const tradeRequest = await this.tradeRequestsRepository.findOne({
      where: { id: String(tradeRequestId) },
      relations: {
        product: true,
        buyer: true,
      },
    });

    if (!tradeRequest) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.TRADE_REQUEST_NOT_FOUND,
        '거래 요청을 찾을 수 없습니다.',
      );
    }

    return tradeRequest;
  }

  assertPending(tradeRequest: TradeRequest, message: string) {
    if (tradeRequest.status !== TradeRequestStatus.PENDING) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_TRADE_REQUEST_STATUS,
        message,
      );
    }
  }

  get repository() {
    return this.tradeRequestsRepository;
  }
}
