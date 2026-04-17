import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import { hashToken } from '../../../../common/utils/token.util';
import { UsersService } from '../../../users/users.service';
import { AuthService } from '../../auth.service';
import { RefreshTokenRevokedReason } from '../../entities/refresh-token.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const storedToken = await this.authService.findRefreshTokenByHash(tokenHash);

    if (storedToken?.revokedAt) {
      if (storedToken.revokedReason === RefreshTokenRevokedReason.LOGOUT) {
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          ERROR_CODES.INVALID_REFRESH_TOKEN,
          'refreshToken이 올바르지 않습니다.',
        );
      }

      if (storedToken.revokedReason === RefreshTokenRevokedReason.EXPIRED) {
        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          ERROR_CODES.EXPIRED_REFRESH_TOKEN,
          'refreshToken이 만료되었습니다.',
        );
      }

      await this.authService.revokeRefreshTokenFamily(storedToken.familyId);
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
        '폐기된 refreshToken입니다. 다시 로그인해주세요.',
      );
    }

    let payload: { sub: string; email: string; familyId: string };

    try {
      payload = await this.authService.verifyRefreshToken(dto.refreshToken);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        if (storedToken && !storedToken.revokedAt) {
          await this.authService.revokeStoredRefreshToken(
            storedToken,
            RefreshTokenRevokedReason.EXPIRED,
          );
        }

        throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          ERROR_CODES.EXPIRED_REFRESH_TOKEN,
          'refreshToken이 만료되었습니다.',
        );
      }

      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'refreshToken이 올바르지 않습니다.',
      );
    }

    if (!storedToken) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.INVALID_REFRESH_TOKEN,
        'refreshToken이 올바르지 않습니다.',
      );
    }

    const user = await this.usersService.findByIdOrThrow(payload.sub);
    const nextTokens = await this.authService.issueTokens({
      id: user.id,
      email: user.email,
      familyId: storedToken.familyId,
    });

    await this.authService.revokeStoredRefreshToken(
      storedToken,
      RefreshTokenRevokedReason.ROTATED,
      hashToken(nextTokens.refreshToken),
    );
    await this.authService.storeRefreshToken(
      user.id,
      nextTokens.refreshToken,
      storedToken.familyId,
    );

    return {
      accessToken: nextTokens.accessToken,
      refreshToken: nextTokens.refreshToken,
    };
  }
}
