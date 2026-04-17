import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { hashToken } from '../../../../common/utils/token.util';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { AuthService } from '../../auth.service';
import { RefreshTokenRevokedReason } from '../../entities/refresh-token.entity';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class LogoutService {
  constructor(private readonly authService: AuthService) {}

  async logout(dto: LogoutDto, user: RequestUser) {
    const storedToken = await this.authService.findRefreshTokenByHash(
      hashToken(dto.refreshToken),
    );

    if (!storedToken || String(storedToken.userId) !== String(user.id)) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'refreshToken이 올바르지 않습니다.',
      );
    }

    await this.authService.revokeStoredRefreshToken(
      storedToken,
      RefreshTokenRevokedReason.LOGOUT,
    );
  }
}
