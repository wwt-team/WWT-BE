import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AUTH_ERROR_MESSAGE_KEY } from '../../common/decorators/auth-error-message.decorator';
import type { UploadedFile } from '../../common/types/uploaded-file.type';
import { ProductsController } from './products.controller';

describe('ProductsController', () => {
  const productListService = { list: jest.fn() };
  const productSearchService = { search: jest.fn() };
  const productDetailService = { detail: jest.fn() };
  const createProductService = { create: jest.fn() };
  const updateProductService = { update: jest.fn() };
  const updateProductImagesService = { updateImages: jest.fn() };
  const uploadProductImagesService = { upload: jest.fn() };
  const deleteProductService = { delete: jest.fn() };
  const updateProductStatusService = { updateStatus: jest.fn() };

  const controller = new ProductsController(
    productListService as never,
    productSearchService as never,
    productDetailService as never,
    createProductService as never,
    updateProductService as never,
    updateProductImagesService as never,
    uploadProductImagesService as never,
    deleteProductService as never,
    updateProductStatusService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates list request', () => {
    const query = { page: 1, limit: 20 };
    controller.list(query as never);
    expect(productListService.list).toHaveBeenCalledWith(query);
  });

  it('delegates search request', () => {
    const query = { keyword: '맥북' };
    controller.search(query as never);
    expect(productSearchService.search).toHaveBeenCalledWith(query);
  });

  it('delegates detail request', () => {
    controller.detail('1');
    expect(productDetailService.detail).toHaveBeenCalledWith('1');
  });

  it('delegates create request', () => {
    const dto = { title: '상품', price: 1000 };
    const user = { id: '1', email: 'test@example.com' };
    controller.create(dto as never, user);
    expect(createProductService.create).toHaveBeenCalledWith(dto, user);
  });

  it('delegates update request', () => {
    const dto = { title: '수정 상품' };
    const user = { id: '1', email: 'test@example.com' };
    controller.update('1', dto as never, user);
    expect(updateProductService.update).toHaveBeenCalledWith('1', dto, user);
  });

  it('delegates product image upload request', () => {
    const files = [
      { originalname: 'product-1.png', mimetype: 'image/png' },
    ] as UploadedFile[];
    const user = { id: '1', email: 'test@example.com' };

    controller.uploadImages('1', files, user);

    expect(uploadProductImagesService.upload).toHaveBeenCalledWith(
      '1',
      files,
      user,
    );
  });

  it('delegates product image update request', () => {
    const dto = { imageUrls: ['https://example.com/product-1.jpg'] };
    const user = { id: '1', email: 'test@example.com' };
    controller.updateImages('1', dto as never, user);
    expect(updateProductImagesService.updateImages).toHaveBeenCalledWith(
      '1',
      dto,
      user,
    );
  });

  it('delegates delete request', () => {
    const user = { id: '1', email: 'test@example.com' };
    controller.delete('1', user);
    expect(deleteProductService.delete).toHaveBeenCalledWith('1', user);
  });

  it('delegates product status update request', () => {
    const dto = { status: 'RESERVED' };
    const user = { id: '1', email: 'test@example.com' };
    controller.updateStatus('1', dto as never, user);
    expect(updateProductStatusService.updateStatus).toHaveBeenCalledWith(
      '1',
      dto,
      user,
    );
  });

  it('uses no-content status on delete', () => {
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, ProductsController.prototype.delete),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('stores route-specific auth messages on protected endpoints', () => {
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ProductsController.prototype.create),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ProductsController.prototype.update),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        ProductsController.prototype.uploadImages,
      ),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        ProductsController.prototype.updateImages,
      ),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ProductsController.prototype.delete),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(
        AUTH_ERROR_MESSAGE_KEY,
        ProductsController.prototype.updateStatus,
      ),
    ).toBeDefined();
  });
});
