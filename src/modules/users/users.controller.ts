import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthErrorMessage } from '../../common/decorators/auth-error-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import type { UploadedFile as UploadedFilePayload } from '../../common/types/uploaded-file.type';
import { UpdateMeDto } from './features/me/dto/update-me.dto';
import { MeService } from './features/me/me.service';
import { UploadProfileImageService } from './features/me/upload-profile-image.service';
import { UpdateMeService } from './features/me/update-me.service';
import { MyProductsQueryDto } from './features/my-products/dto/my-products-query.dto';
import { MyProductsService } from './features/my-products/my-products.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly meService: MeService,
    private readonly updateMeService: UpdateMeService,
    private readonly uploadProfileImageService: UploadProfileImageService,
    private readonly myProductsService: MyProductsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @AuthErrorMessage('내 정보를 조회하려면 인증이 필요합니다.')
  getMe(@CurrentUser() user: RequestUser) {
    return this.meService.getMe(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @AuthErrorMessage('내 정보를 수정하려면 인증이 필요합니다.')
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateMeDto) {
    return this.updateMeService.updateMe(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @AuthErrorMessage('프로필 이미지를 업로드하려면 인증이 필요합니다.')
  uploadProfileImage(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file?: UploadedFilePayload,
  ) {
    return this.uploadProfileImageService.upload(user, file);
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
