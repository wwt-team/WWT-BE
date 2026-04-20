import { HttpStatus, ValidationPipe, type ValidationError } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ERROR_CODES, type ErrorCode } from './common/constants/error-codes';
import { ApiException } from './common/exceptions/api.exception';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const validationMessages: Partial<Record<string, string>> = {
  [ERROR_CODES.INVALID_EMAIL_CODE_REQUEST_EMAIL]:
    '학교 이메일만 회원가입이 가능합니다.',
  [ERROR_CODES.INVALID_SIGNUP_EMAIL]: '학교 이메일만 회원가입이 가능합니다.',
  [ERROR_CODES.INVALID_SIGNUP_PASSWORD]:
    '비밀번호는 최소 8자 이상이어야 합니다.',
  [ERROR_CODES.INVALID_SIGNUP_NICKNAME]: '닉네임은 필수입니다.',
  [ERROR_CODES.MISSING_EMAIL_VERIFICATION_TOKEN]:
    '이메일 인증을 완료해주세요.',
  [ERROR_CODES.INVALID_LOGIN_EMAIL]: '학교 이메일만 회원가입이 가능합니다.',
  [ERROR_CODES.MISSING_LOGIN_PASSWORD]: '비밀번호는 필수입니다.',
  [ERROR_CODES.INVALID_EMAIL_CODE]: '이메일 인증 코드가 올바르지 않습니다.',
  [ERROR_CODES.EXPIRED_EMAIL_CODE]: '이메일 인증 코드가 만료되었습니다.',
  [ERROR_CODES.INVALID_PRODUCTS_PAGE]: 'page는 1 이상의 숫자여야 합니다.',
  [ERROR_CODES.INVALID_PRODUCTS_LIMIT]:
    '상품 개수는 1 이상 100 이하의 숫자여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_STATUS]:
    '상품의 상태는 판매중, 예약중, 거래완료 중 하나여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_MIN_PRICE]:
    '최소 가격은 0 이상의 정수여야 합니다.',
  [ERROR_CODES.INVALID_SEARCH_MAX_PRICE]:
    '최대 가격은 0 이상의 정수여야 합니다.',
  [ERROR_CODES.MISSING_PRODUCT_TITLE]: '상품 제목은 필수입니다.',
  [ERROR_CODES.INVALID_PRODUCT_PRICE]:
    '상품 가격은 0 이상의 정수여야 합니다.',
  [ERROR_CODES.INVALID_PRODUCT_IMAGE_URLS]:
    '상품 이미지 형식이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_PRODUCT_STATUS]:
    '상품 상태가 올바르지 않습니다.',
  [ERROR_CODES.INVALID_TRADE_REQUEST_STATUS]:
    '처리할 수 없는 거래 요청 상태입니다.',
  [ERROR_CODES.INVALID_CHAT_MESSAGE]:
    '메시지 내용이 올바르지 않습니다.',
  [ERROR_CODES.INVALID_REFRESH_TOKEN]:
    '로그인 정보가 올바르지 않습니다. 다시 시도해주세요.',
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (
    process.env.APP_CORS_ORIGIN ??
    'http://localhost:3000,https://wwt.ium.dev,https://www.wwt.ium.dev'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const constraints = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        const code = constraints.find(
          (constraint): constraint is ErrorCode =>
            constraint in validationMessages,
        );

        if (code) {
          return new ApiException(
            HttpStatus.BAD_REQUEST,
            code,
            validationMessages[code] ?? '요청값이 올바르지 않습니다.',
          );
        }

        return new ApiException(
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.INVALID_LOGIN_EMAIL,
          '요청값이 올바르지 않습니다.',
        );
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
