import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes';
import type { ApiExceptionResponse } from '../exceptions/api.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (this.isApiExceptionResponse(exceptionResponse)) {
        return response.status(statusCode).json({
          ...exceptionResponse,
          timestamp: new Date().toISOString(),
          path: request.originalUrl,
        });
      }

      return response.status(statusCode).json({
        statusCode,
        code: this.defaultCode(statusCode),
        message: this.defaultMessage(exceptionResponse),
        timestamp: new Date().toISOString(),
        path: request.originalUrl,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: '서버 내부 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private isApiExceptionResponse(value: unknown): value is ApiExceptionResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'statusCode' in value &&
      'code' in value &&
      'message' in value
    );
  }

  private defaultCode(statusCode: number) {
    if (statusCode === HttpStatus.BAD_REQUEST) {
      return ERROR_CODES.INVALID_LOGIN_EMAIL;
    }

    if (statusCode === HttpStatus.UNAUTHORIZED) {
      return ERROR_CODES.UNAUTHORIZED;
    }

    if (statusCode === HttpStatus.FORBIDDEN) {
      return ERROR_CODES.FORBIDDEN;
    }

    if (statusCode === HttpStatus.NOT_FOUND) {
      return ERROR_CODES.PRODUCT_NOT_FOUND;
    }

    return ERROR_CODES.INTERNAL_SERVER_ERROR;
  }

  private defaultMessage(exceptionResponse: string | object) {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      'message' in exceptionResponse &&
      typeof exceptionResponse.message === 'string'
    ) {
      return exceptionResponse.message;
    }

    return '서버 내부 오류가 발생했습니다.';
  }
}
