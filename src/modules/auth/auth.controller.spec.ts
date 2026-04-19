import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AUTH_ERROR_MESSAGE_KEY } from '../../common/decorators/auth-error-message.decorator';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const emailVerificationService = {
    requestEmailCode: jest.fn(),
    verifyEmailCode: jest.fn(),
  };
  const loginService = { login: jest.fn() };
  const refreshTokenService = { refresh: jest.fn() };
  const logoutService = { logout: jest.fn() };
  const signupService = { signup: jest.fn() };

  const controller = new AuthController(
    emailVerificationService as never,
    loginService as never,
    refreshTokenService as never,
    logoutService as never,
    signupService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates email code request', () => {
    const dto = { email: 'test@example.com' };

    controller.requestEmailCode(dto as never);

    expect(emailVerificationService.requestEmailCode).toHaveBeenCalledWith(dto);
  });

  it('delegates email code verification', () => {
    const dto = { email: 'test@example.com', code: '123456' };

    controller.verifyEmailCode(dto as never);

    expect(emailVerificationService.verifyEmailCode).toHaveBeenCalledWith(dto);
  });

  it('delegates signup', () => {
    const dto = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'tester',
    };

    controller.signup(dto as never);

    expect(signupService.signup).toHaveBeenCalledWith(dto);
  });

  it('delegates login', () => {
    const dto = { email: 'test@example.com', password: 'password123' };

    controller.login(dto as never);

    expect(loginService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates refresh', () => {
    const dto = { refreshToken: 'refresh-token' };

    controller.refresh(dto as never);

    expect(refreshTokenService.refresh).toHaveBeenCalledWith(dto);
  });

  it('delegates logout', async () => {
    const dto = { refreshToken: 'refresh-token' };
    const user = { id: '1', email: 'test@example.com' };

    await controller.logout(dto as never, user);

    expect(logoutService.logout).toHaveBeenCalledWith(dto, user);
  });

  it('uses documented status codes on verify, refresh and logout', () => {
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.verifyEmailCode),
    ).toBe(HttpStatus.OK);
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.refresh),
    ).toBe(HttpStatus.OK);
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, AuthController.prototype.logout),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('stores route-specific auth message on logout', () => {
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        AuthController.prototype.logout,
      ),
    ).toBeDefined();
  });
});
