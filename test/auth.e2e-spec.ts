import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { EmailVerificationService } from '../src/modules/auth/features/email-verification/email-verification.service';
import { LoginService } from '../src/modules/auth/features/login/login.service';
import { LogoutService } from '../src/modules/auth/features/logout/logout.service';
import { RefreshTokenService } from '../src/modules/auth/features/refresh/refresh-token.service';
import { SignupService } from '../src/modules/auth/features/signup/signup.service';
import { createE2EApp } from './support/create-e2e-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const emailVerificationService = {
    requestEmailCode: jest.fn(),
    verifyEmailCode: jest.fn(),
  };
  const loginService = { login: jest.fn() };
  const refreshTokenService = { refresh: jest.fn() };
  const logoutService = { logout: jest.fn() };
  const signupService = { signup: jest.fn() };

  beforeAll(async () => {
    app = await createE2EApp({
      controllers: [AuthController],
      providers: [
        { provide: EmailVerificationService, useValue: emailVerificationService },
        { provide: LoginService, useValue: loginService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: LogoutService, useValue: logoutService },
        { provide: SignupService, useValue: signupService },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signup email-code request succeeds', async () => {
    emailVerificationService.requestEmailCode.mockResolvedValue({
      email: 'student@dsm.hs.kr',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/signup/email-code')
      .send({ email: 'student@dsm.hs.kr' })
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({ email: 'student@dsm.hs.kr' });
    expect(emailVerificationService.requestEmailCode).toHaveBeenCalledWith({
      email: 'student@dsm.hs.kr',
    });
  });

  it('signup email-code request rejects non-dsm email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup/email-code')
      .send({ email: 'student@gmail.com' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_EMAIL_CODE_REQUEST_EMAIL');
    expect(response.body.message).toBe('학교 이메일만 회원가입이 가능합니다.');
  });

  it('login succeeds', async () => {
    loginService.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student@dsm.hs.kr', password: 'password123' })
      .expect(HttpStatus.CREATED);

    expect(response.body.accessToken).toBe('access-token');
    expect(response.body.refreshToken).toBe('refresh-token');
  });

  it('login rejects non-dsm email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'student@naver.com', password: 'password123' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_LOGIN_EMAIL');
    expect(response.body.message).toBe('학교 이메일만 회원가입이 가능합니다.');
  });

  it('refresh validates token input', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: '' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('logout requires authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({ refreshToken: 'refresh-token' })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('logout succeeds with authenticated user', async () => {
    logoutService.logout.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .send({ refreshToken: 'refresh-token' })
      .expect(HttpStatus.NO_CONTENT);

    expect(logoutService.logout).toHaveBeenCalledWith(
      { refreshToken: 'refresh-token' },
      { id: 'user-1', email: 'user@example.com' },
    );
  });
});
