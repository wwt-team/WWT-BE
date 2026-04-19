import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from '../src/modules/users/users.controller';
import { MeService } from '../src/modules/users/features/me/me.service';
import { MyProductsService } from '../src/modules/users/features/my-products/my-products.service';
import { createE2EApp } from './support/create-e2e-app';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  const meService = { getMe: jest.fn() };
  const myProductsService = { getMyProducts: jest.fn() };

  beforeAll(async () => {
    app = await createE2EApp({
      controllers: [UsersController],
      providers: [
        { provide: MeService, useValue: meService },
        { provide: MyProductsService, useValue: myProductsService },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('my profile requires authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('returns my profile', async () => {
    meService.getMe.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      nickname: 'tester',
      emailVerifiedAt: null,
      createdAt: '2026-04-19T00:00:00.000Z',
    });

    const response = await request(app.getHttpServer())
      .get('/api/users/me')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .expect(HttpStatus.OK);

    expect(response.body.email).toBe('user@example.com');
  });

  it('validates my products query', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users/me/products?page=0')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_PRODUCTS_PAGE');
  });

  it('returns my products', async () => {
    myProductsService.getMyProducts.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const response = await request(app.getHttpServer())
      .get('/api/users/me/products')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .expect(HttpStatus.OK);

    expect(response.body.total).toBe(0);
  });
});
