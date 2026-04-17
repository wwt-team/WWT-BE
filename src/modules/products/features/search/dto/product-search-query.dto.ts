import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ProductStatus } from '../../../entities/product.entity';

export class ProductSearchQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'INVALID_SEARCH_STATUS' })
  status?: ProductStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'INVALID_SEARCH_MIN_PRICE' })
  @Min(0, { message: 'INVALID_SEARCH_MIN_PRICE' })
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'INVALID_SEARCH_MAX_PRICE' })
  @Min(0, { message: 'INVALID_SEARCH_MAX_PRICE' })
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'INVALID_PRODUCTS_PAGE' })
  @Min(1, { message: 'INVALID_PRODUCTS_PAGE' })
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'INVALID_PRODUCTS_LIMIT' })
  @Min(1, { message: 'INVALID_PRODUCTS_LIMIT' })
  @Max(100, { message: 'INVALID_PRODUCTS_LIMIT' })
  limit = 20;
}
