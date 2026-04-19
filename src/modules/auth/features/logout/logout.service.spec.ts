import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { hashToken } from '../../../../common/utils/token.util';
import { RefreshTokenRevokedReason } from '../../entities/refresh-token.entity';
import { LogoutService } from './logout.service';

describe('LogoutService', () => {
  const authService = {
    findRefreshTokenByHash: jest.fn(),
    revokeStoredRefreshToken: jest.fn(),
  };

  const service = new LogoutService(authService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects logout when refresh token does not exist', async () => {
    authService.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(
      service.logout(
        { refreshToken: 'refresh-token' },
        { id: '1', email: 'user@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.INVALID_REFRESH_TOKEN,
      },
    });

    expect(authService.findRefreshTokenByHash).toHaveBeenCalledWith(
      hashToken('refresh-token'),
    );
  });

  it('rejects logout when token owner does not match current user', async () => {
    authService.findRefreshTokenByHash.mockResolvedValue({
      userId: '2',
      revokedAt: null,
    });

    await expect(
      service.logout(
        { refreshToken: 'refresh-token' },
        { id: '1', email: 'user@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.INVALID_REFRESH_TOKEN,
      },
    });
  });

  it('revokes refresh token with logout reason', async () => {
    const storedToken = {
      userId: '1',
      revokedAt: null,
    };

    authService.findRefreshTokenByHash.mockResolvedValue(storedToken);
    authService.revokeStoredRefreshToken.mockResolvedValue(undefined);

    await expect(
      service.logout(
        { refreshToken: 'refresh-token' },
        { id: '1', email: 'user@example.com' },
      ),
    ).resolves.toBeUndefined();

    expect(authService.revokeStoredRefreshToken).toHaveBeenCalledWith(
      storedToken,
      RefreshTokenRevokedReason.LOGOUT,
    );
  });
});
