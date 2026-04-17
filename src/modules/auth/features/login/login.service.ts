import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth.service';
import { UsersService } from '../../../users/users.service';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { comparePassword } from '../../../../common/utils/password.util';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw this.invalidCredentials();
    }

    const isPasswordValid = await comparePassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw this.invalidCredentials();
    }

    const tokens = await this.authService.issueTokens({
      id: user.id,
      email: user.email,
    });
    const refreshPayload = this.authService.decodeRefreshToken(
      tokens.refreshToken,
    );

    await this.authService.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      refreshPayload?.familyId ?? '',
    );

    return {
      ...tokens,
      user: {
        id: Number(user.id),
        email: user.email,
        nickname: user.nickname,
      },
    };
  }

  private invalidCredentials() {
    return new ApiException(
      HttpStatus.UNAUTHORIZED,
      ERROR_CODES.INVALID_CREDENTIALS,
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    );
  }
}
