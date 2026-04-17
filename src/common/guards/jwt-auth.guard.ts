import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ERROR_CODES } from '../constants/error-codes';
import { ApiException } from '../exceptions/api.exception';
import type { RequestUser } from '../types/request-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = RequestUser>(err: unknown, user: TUser) {
    if (err || !user) {
      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        '인증이 필요합니다.',
      );
    }

    return user;
  }
}
