import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';
import { SUCCESS_MESSAGE_KEY } from '../decorators/success-message.decorator';

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();
    const message =
      this.reflector.getAllAndOverride<string>(SUCCESS_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? '요청이 성공했습니다.';

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode ?? 200,
        message,
        data: data ?? null,
      })),
    );
  }
}
