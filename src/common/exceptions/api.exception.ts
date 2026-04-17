import { HttpException, HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '../constants/error-codes';

export type ApiExceptionResponse = {
  statusCode: number;
  code: ErrorCode;
  message: string;
};

export class ApiException extends HttpException {
  constructor(statusCode: HttpStatus, code: ErrorCode, message: string) {
    super({ statusCode, code, message }, statusCode);
  }
}
