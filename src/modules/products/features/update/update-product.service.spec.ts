import { ProductStatus } from '../../entities/product.entity';
import { UpdateProductService } from './update-product.service';

describe('UpdateProductService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
    assertSeller: jest.fn(),
    save: jest.fn(),
  };

  const service = new UpdateProductService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a product and returns the documented shape', async () => {
    const updatedAt = new Date('2026-04-19T00:00:00.000Z');
    const product = {
      id: '1',
      sellerId: '10',
      title: '기존 제목',
      description: '기존 설명',
      price: 1000,
      imageUrls: ['old.jpg'],
      status: ProductStatus.ON_SALE,
    };

    productsService.findProductOrThrow.mockResolvedValue(product);
    productsService.save.mockResolvedValue({
      ...product,
      title: '수정된 제목',
      description: '수정된 설명',
      price: 2000,
      imageUrls: ['new.jpg'],
      updatedAt,
    });

    await expect(
      service.update(
        '1',
        {
          title: '수정된 제목',
          description: '수정된 설명',
          price: 2000,
          imageUrls: ['new.jpg'],
        } as never,
        { id: '10', email: 'seller@example.com' },
      ),
    ).resolves.toEqual({
      id: 1,
      title: '수정된 제목',
      description: '수정된 설명',
      price: 2000,
      imageUrls: ['new.jpg'],
      status: ProductStatus.ON_SALE,
      sellerId: 10,
      updatedAt,
    });

    expect(productsService.assertSeller).toHaveBeenCalledWith(
      product,
      '10',
      '상품을 수정할 권한이 없습니다.',
    );
  });
});
