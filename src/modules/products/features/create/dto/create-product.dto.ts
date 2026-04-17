import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'MISSING_PRODUCT_TITLE' })
  @MaxLength(100, { message: 'MISSING_PRODUCT_TITLE' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt({ message: 'INVALID_PRODUCT_PRICE' })
  @Min(0, { message: 'INVALID_PRODUCT_PRICE' })
  price!: number;

  @IsOptional()
  @IsArray({ message: 'INVALID_PRODUCT_IMAGE_URLS' })
  @ArrayMaxSize(10, { message: 'INVALID_PRODUCT_IMAGE_URLS' })
  @IsUrl({}, { each: true, message: 'INVALID_PRODUCT_IMAGE_URLS' })
  imageUrls?: string[];
}
