import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ChatMessagesService } from './chat-messages.service';

describe('ChatMessagesService', () => {
  const chatsService = {
    findRoomOrThrow: jest.fn(),
    assertParticipant: jest.fn(),
    findMessageOrThrow: jest.fn(),
    chatMessagesRepositoryRef: {
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  };

  const service = new ChatMessagesService(chatsService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists room messages in documented shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');

    chatsService.findRoomOrThrow.mockResolvedValue({ id: '1' });
    chatsService.chatMessagesRepositoryRef.findAndCount.mockResolvedValue([
      [
        {
          id: '2',
          chatRoomId: '1',
          content: '안녕하세요',
          isDeleted: false,
          editedAt: null,
          createdAt,
          sender: {
            id: '10',
            nickname: '판매자',
          },
        },
      ],
      1,
    ]);

    await expect(
      service.list(
        '1',
        { id: '10', email: 'seller@example.com' },
        { page: 1, limit: 20 },
      ),
    ).resolves.toEqual({
      items: [
        {
          id: 2,
          chatRoomId: 1,
          sender: {
            id: 10,
            nickname: '판매자',
          },
          content: '안녕하세요',
          isDeleted: false,
          editedAt: null,
          createdAt,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
    });
  });

  it('creates a message in documented shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');

    chatsService.findRoomOrThrow.mockResolvedValue({ id: '1' });
    chatsService.chatMessagesRepositoryRef.create.mockImplementation((input) => input);
    chatsService.chatMessagesRepositoryRef.save.mockResolvedValue({
      id: '2',
      chatRoomId: '1',
      senderId: '10',
      content: '안녕하세요',
      isDeleted: false,
      editedAt: null,
      createdAt,
    });

    await expect(
      service.create(
        '1',
        { content: '안녕하세요' } as never,
        { id: '10', email: 'seller@example.com' },
      ),
    ).resolves.toEqual({
      id: 2,
      chatRoomId: 1,
      senderId: 10,
      content: '안녕하세요',
      isDeleted: false,
      editedAt: null,
      createdAt,
    });
  });

  it('rejects updates to deleted messages', async () => {
    chatsService.findRoomOrThrow.mockResolvedValue({ id: '1' });
    chatsService.findMessageOrThrow.mockResolvedValue({
      id: '2',
      chatRoomId: '1',
      senderId: '10',
      isDeleted: true,
    });

    await expect(
      service.update(
        '1',
        '2',
        { content: '수정' } as never,
        { id: '10', email: 'seller@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ERROR_CODES.INVALID_CHAT_MESSAGE,
        message: '삭제된 메시지는 수정할 수 없습니다.',
      },
    });
  });

  it('rejects message update when message belongs to another room', async () => {
    chatsService.findRoomOrThrow.mockResolvedValue({ id: '1' });
    chatsService.findMessageOrThrow.mockResolvedValue({
      id: '2',
      chatRoomId: '999',
      senderId: '10',
      isDeleted: false,
    });

    await expect(
      service.update(
        '1',
        '2',
        { content: '?섏젙' } as never,
        { id: '10', email: 'seller@example.com' },
      ),
    ).rejects.toMatchObject({
      response: {
        statusCode: HttpStatus.NOT_FOUND,
        code: ERROR_CODES.CHAT_MESSAGE_NOT_FOUND,
      },
    });
  });

  it('soft deletes messages in documented shape', async () => {
    const createdAt = new Date('2026-04-19T00:00:00.000Z');
    const message = {
      id: '2',
      chatRoomId: '1',
      senderId: '10',
      content: '안녕하세요',
      isDeleted: false,
      editedAt: new Date('2026-04-19T01:00:00.000Z'),
      createdAt,
    };

    chatsService.findRoomOrThrow.mockResolvedValue({ id: '1' });
    chatsService.findMessageOrThrow.mockResolvedValue(message);
    chatsService.chatMessagesRepositoryRef.save.mockResolvedValue({
      ...message,
      isDeleted: true,
      content: '삭제된 메시지입니다.',
      editedAt: null,
    });

    await expect(
      service.delete('1', '2', { id: '10', email: 'seller@example.com' }),
    ).resolves.toEqual({
      id: 2,
      chatRoomId: 1,
      senderId: 10,
      content: '삭제된 메시지입니다.',
      isDeleted: true,
      editedAt: null,
      createdAt,
    });
  });
});
