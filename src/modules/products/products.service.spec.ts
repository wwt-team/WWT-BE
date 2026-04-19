import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const productsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const service = new ProductsService(productsRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates product when duplicate does not exist', async () => {
    const input = {
      sellerId: '1',
      title: '맥북 에어',
      description: '상태 좋습니다.',
      price: 900000,
    };

    const created = { ...input, id: '10' };

    productsRepository.findOne.mockResolvedValue(null);
    productsRepository.create.mockReturnValue(created);
    productsRepository.save.mockResolvedValue(created);

    await expect(service.create(input)).resolves.toEqual(created);

    expect(productsRepository.findOne).toHaveBeenCalledWith({
      where: {
        sellerId: '1',
        title: '맥북 에어',
        description: '상태 좋습니다.',
      },
    });
    expect(productsRepository.create).toHaveBeenCalledWith(input);
    expect(productsRepository.save).toHaveBeenCalledWith(created);
  });

  it('rejects duplicate product for same seller and same title/description', async () => {
    productsRepository.findOne.mockResolvedValue({
      id: '99',
      sellerId: '1',
      title: '맥북 에어',
      description: '상태 좋습니다.',
    });

    try {
      await service.create({
        sellerId: '1',
        title: '맥북 에어',
        description: '상태 좋습니다.',
        price: 900000,
      });
      fail('Expected duplicate product exception');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).getResponse()).toEqual(
        new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.DUPLICATE_PRODUCT,
        '동일한 상품이 이미 등록되어 있습니다.',
        ).getResponse(),
      );
    }

    expect(productsRepository.create).not.toHaveBeenCalled();
    expect(productsRepository.save).not.toHaveBeenCalled();
  });

  it('treats missing description as null for duplicate check', async () => {
    productsRepository.findOne.mockResolvedValue(null);
    productsRepository.create.mockReturnValue({ id: '10' });
    productsRepository.save.mockResolvedValue({ id: '10' });

    await service.create({
      sellerId: '1',
      title: '맥북 에어',
      description: undefined,
      price: 900000,
    });

    expect(productsRepository.findOne).toHaveBeenCalledWith({
      where: {
        sellerId: '1',
        title: '맥북 에어',
        description: expect.any(Object),
      },
    });
  });
});
