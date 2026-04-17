import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthErrorMessage } from '../../common/decorators/auth-error-message.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { EmailVerificationService } from './features/email-verification/email-verification.service';
import { RequestEmailCodeDto } from './features/email-verification/dto/request-email-code.dto';
import { VerifyEmailCodeDto } from './features/email-verification/dto/verify-email-code.dto';
import { LoginDto } from './features/login/dto/login.dto';
import { LoginService } from './features/login/login.service';
import { LogoutDto } from './features/logout/dto/logout.dto';
import { LogoutService } from './features/logout/logout.service';
import { RefreshTokenDto } from './features/refresh/dto/refresh-token.dto';
import { RefreshTokenService } from './features/refresh/refresh-token.service';
import { SignupDto } from './features/signup/dto/signup.dto';
import { SignupService } from './features/signup/signup.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
    private readonly loginService: LoginService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly logoutService: LogoutService,
    private readonly signupService: SignupService,
  ) {}

  @Post('signup/email-code')
  @HttpCode(HttpStatus.CREATED)
  requestEmailCode(@Body() dto: RequestEmailCodeDto) {
    return this.emailVerificationService.requestEmailCode(dto);
  }

  @Post('signup/email-code/verify')
  @HttpCode(HttpStatus.OK)
  verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.emailVerificationService.verifyEmailCode(dto);
  }

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.signupService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthErrorMessage('로그아웃하려면 인증이 필요합니다.')
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: RequestUser) {
    await this.logoutService.logout(dto, user);
  }
}
