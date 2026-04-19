import { ProductStatus } from '../../entities/product.entity';
import { ProductDetailService } from './product-detail.service';

describe('ProductDetailService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
  };

  const service = new ProductDetailService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the documented product detail shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');
    const updatedAt = new Date('2026-04-19T01:00:00.000Z');

    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      title: '맥북 팝니다',
      description: '상태 좋습니다.',
      price: 900000,
      imageUrls: ['https://example.com/macbook.jpg'],
      status: ProductStatus.ON_SALE,
      seller: {
        id: '2',
        nickname: '판매자',
      },
      createdAt,
      updatedAt,
    });

    await expect(service.detail('1')).resolves.toEqual({
      id: 1,
      title: '맥북 팝니다',
      description: '상태 좋습니다.',
      price: 900000,
      imageUrls: ['https://example.com/macbook.jpg'],
      status: ProductStatus.ON_SALE,
      seller: {
        id: 2,
        nickname: '판매자',
      },
      createdAt,
      updatedAt,
    });
  });
});
