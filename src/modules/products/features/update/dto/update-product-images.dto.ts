import { ArrayMaxSize, IsArray, IsUrl } from 'class-validator';

export class UpdateProductImagesDto {
  @IsArray({ message: 'INVALID_PRODUCT_IMAGE_URLS' })
  @ArrayMaxSize(10, { message: 'INVALID_PRODUCT_IMAGE_URLS' })
  @IsUrl({}, { each: true, message: 'INVALID_PRODUCT_IMAGE_URLS' })
  imageUrls!: string[];
}
