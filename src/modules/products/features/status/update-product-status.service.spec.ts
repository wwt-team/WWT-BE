import { ProductStatus } from '../../entities/product.entity';
import { UpdateProductStatusService } from './update-product-status.service';

describe('UpdateProductStatusService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
    assertSeller: jest.fn(),
    updateProductStatus: jest.fn(),
  };

  const service = new UpdateProductStatusService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates status and returns documented shape', async () => {
    const updatedAt = new Date('2026-04-19T00:00:00.000Z');
    const product = { id: '1', sellerId: '10', status: ProductStatus.ON_SALE };

    productsService.findProductOrThrow.mockResolvedValue(product);
    productsService.updateProductStatus.mockResolvedValue({
      ...product,
      status: ProductStatus.RESERVED,
      updatedAt,
    });

    await expect(
      service.updateStatus(
        '1',
        { status: ProductStatus.RESERVED } as never,
        { id: '10', email: 'seller@example.com' },
      ),
    ).resolves.toEqual({
      id: 1,
      status: ProductStatus.RESERVED,
      updatedAt,
    });

    expect(productsService.assertSeller).toHaveBeenCalledWith(
      product,
      '10',
      '상품 상태를 변경할 권한이 없습니다.',
    );
  });
});
