import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthErrorMessage } from '../../common/decorators/auth-error-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { AcceptTradeRequestService } from './features/accept/accept-trade-request.service';
import { CreateTradeRequestService } from './features/create/create-trade-request.service';
import { CreateTradeRequestDto } from './features/create/dto/create-trade-request.dto';
import { TradeRequestListQueryDto } from './features/list-by-product/dto/trade-request-list-query.dto';
import { ListProductTradeRequestsService } from './features/list-by-product/list-product-trade-requests.service';
import { MyTradeRequestsQueryDto } from './features/my-list/dto/my-trade-requests-query.dto';
import { MyTradeRequestsService } from './features/my-list/my-trade-requests.service';
import { RejectTradeRequestService } from './features/reject/reject-trade-request.service';

@Controller()
export class TradeRequestsController {
  constructor(
    private readonly createTradeRequestService: CreateTradeRequestService,
    private readonly listProductTradeRequestsService: ListProductTradeRequestsService,
    private readonly acceptTradeRequestService: AcceptTradeRequestService,
    private readonly rejectTradeRequestService: RejectTradeRequestService,
    private readonly myTradeRequestsService: MyTradeRequestsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('products/:productId/trade-requests')
  @AuthErrorMessage('거래 요청을 등록하려면 인증이 필요합니다.')
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateTradeRequestDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.createTradeRequestService.create(productId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('products/:productId/trade-requests')
  @AuthErrorMessage('거래 요청 목록을 조회하려면 인증이 필요합니다.')
  listByProduct(
    @Param('productId') productId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: TradeRequestListQueryDto,
  ) {
    return this.listProductTradeRequestsService.list(productId, user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trade-requests/:tradeRequestId/accept')
  @AuthErrorMessage('거래 요청을 수락하려면 인증이 필요합니다.')
  accept(
    @Param('tradeRequestId') tradeRequestId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.acceptTradeRequestService.accept(tradeRequestId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('trade-requests/:tradeRequestId/reject')
  @AuthErrorMessage('거래 요청을 거절하려면 인증이 필요합니다.')
  reject(
    @Param('tradeRequestId') tradeRequestId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.rejectTradeRequestService.reject(tradeRequestId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('trade-requests/me')
  @AuthErrorMessage('내 거래 요청 목록을 조회하려면 인증이 필요합니다.')
  myList(
    @CurrentUser() user: RequestUser,
    @Query() query: MyTradeRequestsQueryDto,
  ) {
    return this.myTradeRequestsService.list(user, query);
  }
}
