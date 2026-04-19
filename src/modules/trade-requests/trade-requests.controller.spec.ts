import { AUTH_ERROR_MESSAGE_KEY } from '../../common/decorators/auth-error-message.decorator';
import { TradeRequestsController } from './trade-requests.controller';

describe('TradeRequestsController', () => {
  const createTradeRequestService = { create: jest.fn() };
  const listProductTradeRequestsService = { list: jest.fn() };
  const acceptTradeRequestService = { accept: jest.fn() };
  const rejectTradeRequestService = { reject: jest.fn() };
  const myTradeRequestsService = { list: jest.fn() };

  const controller = new TradeRequestsController(
    createTradeRequestService as never,
    listProductTradeRequestsService as never,
    acceptTradeRequestService as never,
    rejectTradeRequestService as never,
    myTradeRequestsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates trade request creation', () => {
    const dto = { message: '구매 원합니다.' };
    const user = { id: '2', email: 'buyer@example.com' };

    controller.create('1', dto as never, user);

    expect(createTradeRequestService.create).toHaveBeenCalledWith('1', dto, user);
  });

  it('delegates product trade request listing', () => {
    const user = { id: '1', email: 'seller@example.com' };
    const query = { page: 1, limit: 20 };

    controller.listByProduct('1', user, query as never);

    expect(listProductTradeRequestsService.list).toHaveBeenCalledWith(
      '1',
      user,
      query,
    );
  });

  it('delegates trade request acceptance', () => {
    const user = { id: '1', email: 'seller@example.com' };

    controller.accept('10', user);

    expect(acceptTradeRequestService.accept).toHaveBeenCalledWith('10', user);
  });

  it('delegates trade request rejection', () => {
    const user = { id: '1', email: 'seller@example.com' };

    controller.reject('10', user);

    expect(rejectTradeRequestService.reject).toHaveBeenCalledWith('10', user);
  });

  it('delegates my trade requests listing', () => {
    const user = { id: '2', email: 'buyer@example.com' };
    const query = { page: 1, limit: 20 };

    controller.myList(user, query as never);

    expect(myTradeRequestsService.list).toHaveBeenCalledWith(user, query);
  });

  it('stores route-specific auth messages on protected endpoints', () => {
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, TradeRequestsController.prototype.create),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        TradeRequestsController.prototype.listByProduct,
      ),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, TradeRequestsController.prototype.accept),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, TradeRequestsController.prototype.reject),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, TradeRequestsController.prototype.myList),
    ).toBeDefined();
  });
});
