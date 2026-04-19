import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { ProductStatus } from '../../entities/product.entity';
import { CreateProductService } from './create-product.service';

describe('CreateProductService', () => {
  const productsService = {
    create: jest.fn(),
  };

  const service = new CreateProductService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a product in documented response shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');
    const updatedAt = new Date('2026-04-19T01:00:00.000Z');

    productsService.create.mockResolvedValue({
      id: '1',
      title: '맥북 에어',
      description: '상태 좋습니다.',
      price: 900000,
      imageUrls: ['https://example.com/macbook.jpg'],
      status: ProductStatus.ON_SALE,
      sellerId: '2',
      createdAt,
      updatedAt,
    });

    await expect(
      service.create(
        {
          title: '맥북 에어',
          description: '상태 좋습니다.',
          price: 900000,
          imageUrls: ['https://example.com/macbook.jpg'],
        } as never,
        { id: '2', email: 'seller@example.com' },
      ),
    ).resolves.toEqual({
      id: 1,
      title: '맥북 에어',
      description: '상태 좋습니다.',
      price: 900000,
      imageUrls: ['https://example.com/macbook.jpg'],
      status: ProductStatus.ON_SALE,
      sellerId: 2,
      createdAt,
      updatedAt,
    });
  });

  it('rejects duplicate product registration for same seller and same title/description', async () => {
    productsService.create.mockRejectedValue(
      new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.DUPLICATE_PRODUCT,
        '동일한 상품이 이미 등록되어 있습니다.',
      ),
    );

    try {
      await service.create(
        {
          title: '맥북 에어',
          description: '상태 좋습니다.',
          price: 900000,
          imageUrls: ['https://example.com/macbook.jpg'],
        } as never,
        { id: '2', email: 'seller@example.com' },
      );
      fail('Expected duplicate product exception');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).getResponse()).toEqual(
        new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.DUPLICATE_PRODUCT,
        '동일한 상품이 이미 등록되어 있습니다.',
        ).getResponse(),
      );
    }
  });
});
