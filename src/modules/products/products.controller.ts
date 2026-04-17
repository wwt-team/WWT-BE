import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthErrorMessage } from '../../common/decorators/auth-error-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { CreateProductDto } from './features/create/dto/create-product.dto';
import { CreateProductService } from './features/create/create-product.service';
import { DeleteProductService } from './features/delete/delete-product.service';
import { ProductDetailService } from './features/detail/product-detail.service';
import { ProductListQueryDto } from './features/list/dto/product-list-query.dto';
import { ProductListService } from './features/list/product-list.service';
import { ProductSearchQueryDto } from './features/search/dto/product-search-query.dto';
import { ProductSearchService } from './features/search/product-search.service';
import { UpdateProductStatusDto } from './features/status/dto/update-product-status.dto';
import { UpdateProductStatusService } from './features/status/update-product-status.service';
import { UpdateProductDto } from './features/update/dto/update-product.dto';
import { UpdateProductService } from './features/update/update-product.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productListService: ProductListService,
    private readonly productSearchService: ProductSearchService,
    private readonly productDetailService: ProductDetailService,
    private readonly createProductService: CreateProductService,
    private readonly updateProductService: UpdateProductService,
    private readonly deleteProductService: DeleteProductService,
    private readonly updateProductStatusService: UpdateProductStatusService,
  ) {}

  @Get()
  list(@Query() query: ProductListQueryDto) {
    return this.productListService.list(query);
  }

  @Get('search')
  search(@Query() query: ProductSearchQueryDto) {
    return this.productSearchService.search(query);
  }

  @Get(':productId')
  detail(@Param('productId') productId: string) {
    return this.productDetailService.detail(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @AuthErrorMessage('상품을 등록하려면 인증이 필요합니다.')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: RequestUser) {
    return this.createProductService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':productId')
  @AuthErrorMessage('상품을 수정하려면 인증이 필요합니다.')
  update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.updateProductService.update(productId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthErrorMessage('상품을 삭제하려면 인증이 필요합니다.')
  delete(
    @Param('productId') productId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.deleteProductService.delete(productId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':productId/status')
  @AuthErrorMessage('상품 상태를 변경하려면 인증이 필요합니다.')
  updateStatus(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.updateProductStatusService.updateStatus(productId, dto, user);
  }
}
