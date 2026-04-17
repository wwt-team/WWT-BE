import { HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ERROR_CODES } from '../constants/error-codes';
import { AUTH_ERROR_MESSAGE_KEY } from '../decorators/auth-error-message.decorator';
import { ApiException } from '../exceptions/api.exception';
import type { RequestUser } from '../types/request-user.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  handleRequest<TUser = RequestUser>(
    err: unknown,
    user: TUser,
    _info: unknown,
    context: { getHandler: () => unknown; getClass: () => unknown },
  ) {
    if (err || !user) {
      const message =
        this.reflector.getAllAndOverride<string>(AUTH_ERROR_MESSAGE_KEY, [
          context.getHandler() as never,
          context.getClass() as never,
        ]) ?? '인증이 필요합니다.';

      throw new ApiException(
        HttpStatus.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        message,
      );
    }

    return user;
  }
}
