import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ProductStatus } from '../../entities/product.entity';
import { ProductSearchService } from './product-search.service';

describe('ProductSearchService', () => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };
  const productsService = {
    repository: {
      createQueryBuilder: jest.fn(() => builder),
    },
  };

  const service = new ProductSearchService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
    productsService.repository.createQueryBuilder.mockReturnValue(builder);
    builder.select.mockReturnThis();
    builder.orderBy.mockReturnThis();
    builder.skip.mockReturnThis();
    builder.take.mockReturnThis();
    builder.andWhere.mockReturnThis();
  });

  it('throws the documented error when minPrice is greater than maxPrice', async () => {
    await expect(
      service.search({
        page: 1,
        limit: 20,
        minPrice: 10000,
        maxPrice: 1000,
      } as never),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.INVALID_SEARCH_PRICE_RANGE,
        message: 'minPrice는 maxPrice보다 클 수 없습니다.',
      },
    });
  });

  it('applies filters and maps search results', async () => {
    builder.getManyAndCount.mockResolvedValue([
      [
        {
          id: '1',
          title: '맥북 팝니다',
          price: 900000,
        },
      ],
      1,
    ]);

    await expect(
      service.search({
        page: 2,
        limit: 10,
        keyword: '맥북',
        status: ProductStatus.ON_SALE,
        minPrice: 100000,
        maxPrice: 1000000,
      } as never),
    ).resolves.toEqual({
      items: [
        {
          id: 1,
          title: '맥북 팝니다',
          price: 900000,
        },
      ],
      page: 2,
      limit: 10,
      total: 1,
    });

    expect(productsService.repository.createQueryBuilder).toHaveBeenCalledWith(
      'product',
    );
    expect(builder.skip).toHaveBeenCalledWith(10);
    expect(builder.take).toHaveBeenCalledWith(10);
    expect(builder.andWhere).toHaveBeenCalledWith('product.title ILIKE :keyword', {
      keyword: '%맥북%',
    });
    expect(builder.andWhere).toHaveBeenCalledWith('product.status = :status', {
      status: ProductStatus.ON_SALE,
    });
    expect(builder.andWhere).toHaveBeenCalledWith('product.price >= :minPrice', {
      minPrice: 100000,
    });
    expect(builder.andWhere).toHaveBeenCalledWith('product.price <= :maxPrice', {
      maxPrice: 1000000,
    });
  });
});
