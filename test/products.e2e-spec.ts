import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateProductService } from '../src/modules/products/features/create/create-product.service';
import { DeleteProductService } from '../src/modules/products/features/delete/delete-product.service';
import { ProductDetailService } from '../src/modules/products/features/detail/product-detail.service';
import { ProductListService } from '../src/modules/products/features/list/product-list.service';
import { ProductSearchService } from '../src/modules/products/features/search/product-search.service';
import { UpdateProductStatusService } from '../src/modules/products/features/status/update-product-status.service';
import { UpdateProductService } from '../src/modules/products/features/update/update-product.service';
import { ProductsController } from '../src/modules/products/products.controller';
import { createE2EApp } from './support/create-e2e-app';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  const productListService = { list: jest.fn() };
  const productSearchService = { search: jest.fn() };
  const productDetailService = { detail: jest.fn() };
  const createProductService = { create: jest.fn() };
  const updateProductService = { update: jest.fn() };
  const deleteProductService = { delete: jest.fn() };
  const updateProductStatusService = { updateStatus: jest.fn() };

  beforeAll(async () => {
    app = await createE2EApp({
      controllers: [ProductsController],
      providers: [
        { provide: ProductListService, useValue: productListService },
        { provide: ProductSearchService, useValue: productSearchService },
        { provide: ProductDetailService, useValue: productDetailService },
        { provide: CreateProductService, useValue: createProductService },
        { provide: UpdateProductService, useValue: updateProductService },
        { provide: DeleteProductService, useValue: deleteProductService },
        {
          provide: UpdateProductStatusService,
          useValue: updateProductStatusService,
        },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns product list', async () => {
    productListService.list.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const response = await request(app.getHttpServer())
      .get('/api/products')
      .expect(HttpStatus.OK);

    expect(response.body.total).toBe(0);
  });

  it('validates search status', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/products/search?status=INVALID')
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_SEARCH_STATUS');
  });

  it('requires authentication for create', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .send({ title: '상품', price: 1000 })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('creates a product', async () => {
    createProductService.create.mockResolvedValue({
      id: 'product-1',
      title: '상품',
      description: '설명',
      price: 1000,
      status: 'ON_SALE',
      imageUrls: [],
    });

    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('x-test-user-id', 'seller-1')
      .set('x-test-user-email', 'seller@example.com')
      .send({ title: '상품', description: '설명', price: 1000 })
      .expect(HttpStatus.CREATED);

    expect(response.body.id).toBe('product-1');
  });

  it('validates product status change', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/products/product-1/status')
      .set('x-test-user-id', 'seller-1')
      .set('x-test-user-email', 'seller@example.com')
      .send({ status: 'INVALID' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_PRODUCT_STATUS');
  });
});
