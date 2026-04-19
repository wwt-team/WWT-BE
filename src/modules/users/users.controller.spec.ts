import { AUTH_ERROR_MESSAGE_KEY } from '../../common/decorators/auth-error-message.decorator';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const meService = { getMe: jest.fn() };
  const myProductsService = { getMyProducts: jest.fn() };

  const controller = new UsersController(
    meService as never,
    myProductsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates my profile lookup', () => {
    const user = { id: '1', email: 'test@example.com' };

    controller.getMe(user);

    expect(meService.getMe).toHaveBeenCalledWith(user);
  });

  it('delegates my products lookup', () => {
    const user = { id: '1', email: 'test@example.com' };
    const query = { page: 1, limit: 20 };

    controller.getMyProducts(user, query as never);

    expect(myProductsService.getMyProducts).toHaveBeenCalledWith(user, query);
  });

  it('stores route-specific auth messages', () => {
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, UsersController.prototype.getMe),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        UsersController.prototype.getMyProducts,
      ),
    ).toBeDefined();
  });
});
