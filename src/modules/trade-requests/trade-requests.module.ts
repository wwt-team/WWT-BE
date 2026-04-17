import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { TradeRequest } from './entities/trade-request.entity';
import { AcceptTradeRequestService } from './features/accept/accept-trade-request.service';
import { CreateTradeRequestService } from './features/create/create-trade-request.service';
import { ListProductTradeRequestsService } from './features/list-by-product/list-product-trade-requests.service';
import { MyTradeRequestsService } from './features/my-list/my-trade-requests.service';
import { RejectTradeRequestService } from './features/reject/reject-trade-request.service';
import { TradeRequestsController } from './trade-requests.controller';
import { TradeRequestsService } from './trade-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([TradeRequest]), ProductsModule],
  controllers: [TradeRequestsController],
  providers: [
    TradeRequestsService,
    CreateTradeRequestService,
    ListProductTradeRequestsService,
    AcceptTradeRequestService,
    RejectTradeRequestService,
    MyTradeRequestsService,
  ],
  exports: [TradeRequestsService],
})
export class TradeRequestsModule {}
