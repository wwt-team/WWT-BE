import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { S3UploadService } from '../../../../common/services/s3-upload.service';
import type { RequestUser } from '../../../../common/types/request-user.type';
import type { UploadedFile } from '../../../../common/types/uploaded-file.type';
import { ProductsService } from '../../products.service';

@Injectable()
export class UploadProductImagesService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  async upload(
    productId: string,
    files: UploadedFile[] | undefined,
    user: RequestUser,
  ) {
    if (!files?.length) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_PRODUCT_IMAGE_FILES,
        '상품 이미지를 업로드해주세요.',
      );
    }

    if (files.some((file) => !file.mimetype?.startsWith('image/'))) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_PRODUCT_IMAGE_FILE,
        '이미지 파일만 업로드할 수 있습니다.',
      );
    }

    const product = await this.productsService.findProductOrThrow(productId);

    this.productsService.assertSeller(
      product,
      user.id,
      '상품 이미지를 수정할 권한이 없습니다.',
    );

    if (product.imageUrls.length + files.length > 10) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.PRODUCT_IMAGE_LIMIT_EXCEEDED,
        '상품 이미지는 최대 10장까지 업로드할 수 있습니다.',
      );
    }

    const uploadedUrls = await Promise.all(
      files.map((file) =>
        this.s3UploadService.uploadImage(file, `products/${productId}`),
      ),
    );

    product.imageUrls = [...product.imageUrls, ...uploadedUrls];

    const updatedProduct = await this.productsService.save(product);

    return {
      id: Number(updatedProduct.id),
      imageUrls: updatedProduct.imageUrls,
      updatedAt: updatedProduct.updatedAt,
    };
  }
}
