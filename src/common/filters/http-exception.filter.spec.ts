import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes';
import { ApiException } from '../exceptions/api.exception';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createHost = (path = '/api/test') => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();

    return {
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status, json }),
          getRequest: () => ({ originalUrl: path }),
        }),
      },
      status,
      json,
    };
  };

  it('passes through ApiException response shape', () => {
    const { host, status, json } = createHost('/api/products');

    filter.catch(
      new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.PRODUCT_NOT_FOUND,
        '상품을 찾을 수 없습니다.',
      ),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.PRODUCT_NOT_FOUND,
        message: '상품을 찾을 수 없습니다.',
        path: '/api/products',
      }),
    );
  });

  it('returns generic not-found response for non-domain 404 errors', () => {
    const { host, status, json } = createHost('/');

    filter.catch(
      new HttpException('Cannot GET /', HttpStatus.NOT_FOUND),
      host as never,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.NOT_FOUND,
        message: '요청한 경로를 찾을 수 없습니다.',
        path: '/',
      }),
    );
  });

  it('returns internal server error for unknown exceptions', () => {
    const { status, json, host } = createHost('/api/chats');

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: '서버 내부 오류가 발생했습니다.',
        path: '/api/chats',
      }),
    );
  });
});
