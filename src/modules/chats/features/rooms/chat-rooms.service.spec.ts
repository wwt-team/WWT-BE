import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ChatRoomsService } from './chat-rooms.service';

describe('ChatRoomsService', () => {
  const chatsService = {
    chatRoomsRepositoryRef: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    },
    chatMessagesRepositoryRef: {
      findOne: jest.fn(),
    },
  };
  const productsService = {
    findProductOrThrow: jest.fn(),
  };
  const usersService = {
    findByIdOrThrow: jest.fn(),
  };

  const service = new ChatRoomsService(
    chatsService as never,
    productsService as never,
    usersService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires productId', async () => {
    await expect(
      service.create({ receiverId: 2 } as never, {
        id: '1',
        email: 'user@example.com',
      }),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.MISSING_CHAT_PRODUCT_ID,
        message: '거래할 상품을 선택해주세요.',
      },
    });
  });

  it('rejects self chat room creation', async () => {
    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
    });

    await expect(
      service.create(
        { productId: 1, receiverId: 20 } as never,
        { id: '20', email: 'user@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.CONFLICT,
        code: ERROR_CODES.SELF_TRADE_NOT_ALLOWED,
        message: '자기 자신과 채팅방을 만들 수 없습니다.',
      },
    });
  });

  it('rejects invalid receiver when buyer targets a non-seller', async () => {
    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
    });
    usersService.findByIdOrThrow.mockResolvedValue({
      id: '999',
    });

    await expect(
      service.create(
        { productId: 1, receiverId: 999 } as never,
        { id: '20', email: 'buyer@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.INVALID_CHAT_RECEIVER_ID,
      },
    });
  });

  it('returns the existing room when already created', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');

    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
    });
    usersService.findByIdOrThrow.mockResolvedValue({
      id: '10',
    });
    chatsService.chatRoomsRepositoryRef.findOne.mockResolvedValue({
      id: '3',
      productId: '1',
      buyerId: '20',
      sellerId: '10',
      createdAt,
    });

    await expect(
      service.create(
        { productId: 1, receiverId: 10 } as never,
        { id: '20', email: 'buyer@example.com' },
      ),
    ).resolves.toEqual({
      id: 3,
      productId: 1,
      buyerId: 20,
      sellerId: 10,
      createdAt,
    });
  });

  it('creates a new room in documented shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');

    productsService.findProductOrThrow.mockResolvedValue({
      id: '1',
      sellerId: '10',
    });
    usersService.findByIdOrThrow.mockResolvedValue({
      id: '10',
    });
    chatsService.chatRoomsRepositoryRef.findOne.mockResolvedValue(null);
    chatsService.chatRoomsRepositoryRef.create.mockImplementation((input) => input);
    chatsService.chatRoomsRepositoryRef.save.mockResolvedValue({
      id: '5',
      productId: '1',
      buyerId: '20',
      sellerId: '10',
      createdAt,
    });

    await expect(
      service.create(
        { productId: 1, receiverId: 10 } as never,
        { id: '20', email: 'buyer@example.com' },
      ),
    ).resolves.toEqual({
      id: 5,
      productId: 1,
      buyerId: 20,
      sellerId: 10,
      createdAt,
    });
  });
});
