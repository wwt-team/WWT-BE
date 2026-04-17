import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { hashToken } from '../../common/utils/token.util';
import { RefreshToken, RefreshTokenRevokedReason } from './entities/refresh-token.entity';

type TokenUser = {
  id: string;
  email: string;
  familyId?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async issueTokens(user: TokenUser) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
    };
    const refreshPayload = {
      sub: user.id,
      email: user.email,
      familyId: user.familyId ?? randomUUID(),
      jti: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(refreshToken: string) {
    return this.jwtService.verifyAsync<{
      sub: string;
      email: string;
      familyId: string;
      jti: string;
    }>(refreshToken, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  async storeRefreshToken(userId: string, rawRefreshToken: string, familyId: string) {
    const decoded = this.decodeRefreshToken(rawRefreshToken);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(
          Date.now() +
            14 * 24 * 60 * 60 * 1000,
        );

    const refreshToken = this.refreshTokensRepository.create({
      userId,
      tokenHash: hashToken(rawRefreshToken),
      familyId,
      expiresAt,
      revokedAt: null,
      revokedReason: null,
      replacedByTokenHash: null,
    });

    return this.refreshTokensRepository.save(refreshToken);
  }

  findRefreshTokenByHash(tokenHash: string) {
    return this.refreshTokensRepository.findOne({ where: { tokenHash } });
  }

  decodeRefreshToken(refreshToken: string) {
    return this.jwtService.decode(refreshToken) as
      | { exp?: number; familyId?: string }
      | null;
  }

  async revokeStoredRefreshToken(
    refreshToken: RefreshToken,
    revokedReason: RefreshTokenRevokedReason,
    replacedByTokenHash?: string,
  ) {
    refreshToken.revokedAt = new Date();
    refreshToken.revokedReason = revokedReason;
    refreshToken.replacedByTokenHash = replacedByTokenHash ?? null;
    return this.refreshTokensRepository.save(refreshToken);
  }

  revokeRefreshTokenFamily(familyId: string) {
    return this.refreshTokensRepository.update(
      { familyId, revokedAt: IsNull() },
      {
        revokedAt: new Date(),
        revokedReason: RefreshTokenRevokedReason.REUSE_DETECTED,
      },
    );
  }
}
