import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthErrorMessage } from '../../common/decorators/auth-error-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { MeService } from './features/me/me.service';
import { MyProductsQueryDto } from './features/my-products/dto/my-products-query.dto';
import { MyProductsService } from './features/my-products/my-products.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly meService: MeService,
    private readonly myProductsService: MyProductsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @AuthErrorMessage('내 정보를 조회하려면 인증이 필요합니다.')
  getMe(@CurrentUser() user: RequestUser) {
    return this.meService.getMe(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/products')
  @AuthErrorMessage('내 상품 목록을 조회하려면 인증이 필요합니다.')
  getMyProducts(
    @CurrentUser() user: RequestUser,
    @Query() query: MyProductsQueryDto,
  ) {
    return this.myProductsService.getMyProducts(user, query);
  }
}
