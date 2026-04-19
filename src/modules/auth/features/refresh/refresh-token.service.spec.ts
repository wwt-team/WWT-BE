import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { hashToken } from '../../../../common/utils/token.util';
import { RefreshTokenRevokedReason } from '../../entities/refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  const authService = {
    findRefreshTokenByHash: jest.fn(),
    verifyRefreshToken: jest.fn(),
    revokeRefreshTokenFamily: jest.fn(),
    revokeStoredRefreshToken: jest.fn(),
    issueTokens: jest.fn(),
    storeRefreshToken: jest.fn(),
  };
  const usersService = {
    findByIdOrThrow: jest.fn(),
  };

  const service = new RefreshTokenService(
    authService as never,
    usersService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('treats logout-revoked refresh token as invalid', async () => {
    authService.findRefreshTokenByHash.mockResolvedValue({
      tokenHash: hashToken('refresh-token'),
      revokedAt: new Date(),
      revokedReason: RefreshTokenRevokedReason.LOGOUT,
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.INVALID_REFRESH_TOKEN,
      },
    });
  });

  it('treats expired revoked refresh token as expired', async () => {
    authService.findRefreshTokenByHash.mockResolvedValue({
      tokenHash: hashToken('refresh-token'),
      revokedAt: new Date(),
      revokedReason: RefreshTokenRevokedReason.EXPIRED,
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.EXPIRED_REFRESH_TOKEN,
      },
    });
  });

  it('revokes token family when rotated token is reused', async () => {
    authService.findRefreshTokenByHash.mockResolvedValue({
      tokenHash: hashToken('refresh-token'),
      familyId: 'family-1',
      revokedAt: new Date(),
      revokedReason: RefreshTokenRevokedReason.ROTATED,
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.REFRESH_TOKEN_REUSE_DETECTED,
      },
    });

    expect(authService.revokeRefreshTokenFamily).toHaveBeenCalledWith('family-1');
  });

  it('marks active stored token as expired when jwt verification says expired', async () => {
    const storedToken = {
      tokenHash: hashToken('refresh-token'),
      familyId: 'family-1',
      revokedAt: null,
    };

    authService.findRefreshTokenByHash.mockResolvedValue(storedToken);
    authService.verifyRefreshToken.mockRejectedValue({ name: 'TokenExpiredError' });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: ERROR_CODES.EXPIRED_REFRESH_TOKEN,
      },
    });

    expect(authService.revokeStoredRefreshToken).toHaveBeenCalledWith(
      storedToken,
      RefreshTokenRevokedReason.EXPIRED,
    );
  });

  it('rotates refresh token on success', async () => {
    const storedToken = {
      tokenHash: hashToken('refresh-token'),
      familyId: 'family-1',
      revokedAt: null,
    };

    authService.findRefreshTokenByHash.mockResolvedValue(storedToken);
    authService.verifyRefreshToken.mockResolvedValue({
      sub: '1',
      email: 'user@example.com',
      familyId: 'family-1',
    });
    usersService.findByIdOrThrow.mockResolvedValue({
      id: '1',
      email: 'user@example.com',
    });
    authService.issueTokens.mockResolvedValue({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    await expect(
      service.refresh({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual({
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    });

    expect(authService.revokeStoredRefreshToken).toHaveBeenCalledWith(
      storedToken,
      RefreshTokenRevokedReason.ROTATED,
      hashToken('next-refresh-token'),
    );
    expect(authService.storeRefreshToken).toHaveBeenCalledWith(
      '1',
      'next-refresh-token',
      'family-1',
    );
  });
});
