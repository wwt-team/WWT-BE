import { DeleteProductService } from './delete-product.service';

describe('DeleteProductService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
    assertSeller: jest.fn(),
    repository: {
      delete: jest.fn(),
    },
  };

  const service = new DeleteProductService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a product after seller validation', async () => {
    const product = { id: '1', sellerId: '10' };
    productsService.findProductOrThrow.mockResolvedValue(product);

    await service.delete('1', { id: '10', email: 'seller@example.com' });

    expect(productsService.assertSeller).toHaveBeenCalledWith(
      product,
      '10',
      '상품을 삭제할 권한이 없습니다.',
    );
    expect(productsService.repository.delete).toHaveBeenCalledWith('1');
  });
});
