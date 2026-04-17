import { IsEnum } from 'class-validator';
import { ProductStatus } from '../../../entities/product.entity';

export class UpdateProductStatusDto {
  @IsEnum(ProductStatus, { message: 'INVALID_PRODUCT_STATUS' })
  status!: ProductStatus;
}
