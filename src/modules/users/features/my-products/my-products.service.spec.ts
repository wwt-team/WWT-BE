import { ProductStatus } from '../../../products/entities/product.entity';
import { MyProductsService } from './my-products.service';

describe('MyProductsService', () => {
  const usersService = {
    findByIdOrThrow: jest.fn(),
  };
  const productsService = {
    repository: {
      findAndCount: jest.fn(),
    },
  };

  const service = new MyProductsService(
    usersService as never,
    productsService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies the current user before loading products', async () => {
    usersService.findByIdOrThrow.mockResolvedValue({ id: '1' });
    productsService.repository.findAndCount.mockResolvedValue([[], 0]);

    await service.getMyProducts(
      { id: '1', email: 'user@example.com' },
      { page: 1, limit: 20 },
    );

    expect(usersService.findByIdOrThrow).toHaveBeenCalledWith('1');
  });

  it('returns paginated products in documented shape', async () => {
    const createdAt = new Date('2026-04-19T02:00:00.000Z');

    usersService.findByIdOrThrow.mockResolvedValue({ id: '1' });
    productsService.repository.findAndCount.mockResolvedValue([
      [
        {
          id: '10',
          title: '맥북 팝니다',
          price: 900000,
          status: ProductStatus.ON_SALE,
          createdAt,
        },
      ],
      1,
    ]);

    await expect(
      service.getMyProducts(
        { id: '1', email: 'user@example.com' },
        { page: 1, limit: 20 },
      ),
    ).resolves.toEqual({
      items: [
        {
          id: 10,
          title: '맥북 팝니다',
          price: 900000,
          status: ProductStatus.ON_SALE,
          createdAt,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });

    expect(productsService.repository.findAndCount).toHaveBeenCalledWith({
      select: {
        id: true,
        title: true,
        price: true,
        status: true,
        createdAt: true,
      },
      where: { sellerId: '1' },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 20,
    });
  });
});
