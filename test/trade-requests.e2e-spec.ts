import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TradeRequestsController } from '../src/modules/trade-requests/trade-requests.controller';
import { AcceptTradeRequestService } from '../src/modules/trade-requests/features/accept/accept-trade-request.service';
import { CreateTradeRequestService } from '../src/modules/trade-requests/features/create/create-trade-request.service';
import { ListProductTradeRequestsService } from '../src/modules/trade-requests/features/list-by-product/list-product-trade-requests.service';
import { MyTradeRequestsService } from '../src/modules/trade-requests/features/my-list/my-trade-requests.service';
import { RejectTradeRequestService } from '../src/modules/trade-requests/features/reject/reject-trade-request.service';
import { createE2EApp } from './support/create-e2e-app';

describe('TradeRequestsController (e2e)', () => {
  let app: INestApplication;

  const createTradeRequestService = { create: jest.fn() };
  const listProductTradeRequestsService = { list: jest.fn() };
  const acceptTradeRequestService = { accept: jest.fn() };
  const rejectTradeRequestService = { reject: jest.fn() };
  const myTradeRequestsService = { list: jest.fn() };

  beforeAll(async () => {
    app = await createE2EApp({
      controllers: [TradeRequestsController],
      providers: [
        { provide: CreateTradeRequestService, useValue: createTradeRequestService },
        {
          provide: ListProductTradeRequestsService,
          useValue: listProductTradeRequestsService,
        },
        { provide: AcceptTradeRequestService, useValue: acceptTradeRequestService },
        { provide: RejectTradeRequestService, useValue: rejectTradeRequestService },
        { provide: MyTradeRequestsService, useValue: myTradeRequestsService },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication for trade request creation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products/product-1/trade-requests')
      .send({ message: '구매 원합니다.' })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('creates a trade request', async () => {
    createTradeRequestService.create.mockResolvedValue({
      id: 'trade-1',
      status: 'PENDING',
      message: '구매 원합니다.',
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/product-1/trade-requests')
      .set('x-test-user-id', 'buyer-1')
      .set('x-test-user-email', 'buyer@example.com')
      .send({ message: '구매 원합니다.' })
      .expect(HttpStatus.CREATED);

    expect(response.body.status).toBe('PENDING');
  });

  it('lists trade requests by product', async () => {
    listProductTradeRequestsService.list.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const response = await request(app.getHttpServer())
      .get('/api/products/product-1/trade-requests')
      .set('x-test-user-id', 'seller-1')
      .set('x-test-user-email', 'seller@example.com')
      .expect(HttpStatus.OK);

    expect(response.body.total).toBe(0);
  });

  it('accepts a trade request', async () => {
    acceptTradeRequestService.accept.mockResolvedValue({
      id: 'trade-1',
      status: 'ACCEPTED',
    });

    const response = await request(app.getHttpServer())
      .patch('/api/trade-requests/trade-1/accept')
      .set('x-test-user-id', 'seller-1')
      .set('x-test-user-email', 'seller@example.com')
      .expect(HttpStatus.OK);

    expect(response.body.status).toBe('ACCEPTED');
  });
});
