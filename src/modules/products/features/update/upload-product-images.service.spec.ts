import { ApiException } from '../../../../common/exceptions/api.exception';
import type { UploadedFile } from '../../../../common/types/uploaded-file.type';
import { UploadProductImagesService } from './upload-product-images.service';

describe('UploadProductImagesService', () => {
  const productsService = {
    findProductOrThrow: jest.fn(),
    assertSeller: jest.fn(),
    save: jest.fn(),
  };
  const s3UploadService = {
    uploadImage: jest.fn(),
  };

  const service = new UploadProductImagesService(
    productsService as never,
    s3UploadService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uploads product images and appends urls', async () => {
    const updatedAt = new Date('2026-04-20T00:00:00.000Z');
    const product = {
      id: '1',
      sellerId: 'seller-1',
      imageUrls: ['https://example.com/old.jpg'],
    };
    const files = [
      {
        originalname: 'product-1.png',
        mimetype: 'image/png',
        buffer: Buffer.from('image-1'),
      },
      {
        originalname: 'product-2.png',
        mimetype: 'image/png',
        buffer: Buffer.from('image-2'),
      },
    ] as UploadedFile[];

    productsService.findProductOrThrow.mockResolvedValue(product);
    s3UploadService.uploadImage
      .mockResolvedValueOnce('https://example.com/new-1.jpg')
      .mockResolvedValueOnce('https://example.com/new-2.jpg');
    productsService.save.mockResolvedValue({
      ...product,
      imageUrls: [
        'https://example.com/old.jpg',
        'https://example.com/new-1.jpg',
        'https://example.com/new-2.jpg',
      ],
      updatedAt,
    });

    await expect(
      service.upload('1', files, { id: 'seller-1', email: 'seller@dsm.hs.kr' }),
    ).resolves.toEqual({
      id: 1,
      imageUrls: [
        'https://example.com/old.jpg',
        'https://example.com/new-1.jpg',
        'https://example.com/new-2.jpg',
      ],
      updatedAt,
    });
  });

  it('rejects non-image product files', async () => {
    const files = [
      {
        originalname: 'product.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('image-1'),
      },
    ] as UploadedFile[];

    await expect(
      service.upload('1', files, { id: 'seller-1', email: 'seller@dsm.hs.kr' }),
    ).rejects.toBeInstanceOf(ApiException);
  });
});
