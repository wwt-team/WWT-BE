import { UpdateProductImagesService } from './update-product-images.service';

describe('UpdateProductImagesService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
    assertSeller: jest.fn(),
    save: jest.fn(),
  };

  const service = new UpdateProductImagesService(productsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates only product image urls', async () => {
    const updatedAt = new Date('2026-04-20T00:00:00.000Z');
    const product = {
      id: '1',
      sellerId: 'seller-1',
      imageUrls: ['https://example.com/old.jpg'],
    };

    productsService.findProductOrThrow.mockResolvedValue(product);
    productsService.save.mockResolvedValue({
      ...product,
      imageUrls: ['https://example.com/new.jpg'],
      updatedAt,
    });

    await expect(
      service.updateImages(
        '1',
        { imageUrls: ['https://example.com/new.jpg'] },
        { id: 'seller-1', email: 'seller@example.com' },
      ),
    ).resolves.toEqual({
      id: 1,
      imageUrls: ['https://example.com/new.jpg'],
      updatedAt,
    });

    expect(productsService.assertSeller).toHaveBeenCalled();
  });
});
