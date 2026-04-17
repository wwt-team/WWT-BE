import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class TradeRequestListQueryDto {
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
