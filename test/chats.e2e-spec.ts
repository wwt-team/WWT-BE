import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ChatsController } from '../src/modules/chats/chats.controller';
import { ChatMessagesService } from '../src/modules/chats/features/messages/chat-messages.service';
import { ChatRoomsService } from '../src/modules/chats/features/rooms/chat-rooms.service';
import { createE2EApp } from './support/create-e2e-app';

describe('ChatsController (e2e)', () => {
  let app: INestApplication;

  const chatRoomsService = {
    create: jest.fn(),
    list: jest.fn(),
  };
  const chatMessagesService = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2EApp({
      controllers: [ChatsController],
      providers: [
        { provide: ChatRoomsService, useValue: chatRoomsService },
        { provide: ChatMessagesService, useValue: chatMessagesService },
      ],
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication for chat room creation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chats')
      .send({ productId: 1, receiverId: 2 })
      .expect(HttpStatus.UNAUTHORIZED);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('creates a chat room', async () => {
    chatRoomsService.create.mockResolvedValue({
      id: 'chat-room-1',
      productId: 1,
      receiverId: 2,
    });

    const response = await request(app.getHttpServer())
      .post('/api/chats')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .send({ productId: 1, receiverId: 2 })
      .expect(HttpStatus.CREATED);

    expect(response.body.id).toBe('chat-room-1');
  });

  it('lists chat rooms', async () => {
    chatRoomsService.list.mockResolvedValue({
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    });

    const response = await request(app.getHttpServer())
      .get('/api/chats')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .expect(HttpStatus.OK);

    expect(response.body.total).toBe(0);
  });

  it('validates empty message creation', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/chats/chat-room-1/messages')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .send({ content: '' })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body.code).toBe('INVALID_CHAT_MESSAGE');
  });

  it('deletes a message', async () => {
    chatMessagesService.delete.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/api/chats/chat-room-1/messages/message-1')
      .set('x-test-user-id', 'user-1')
      .set('x-test-user-email', 'user@example.com')
      .expect(HttpStatus.NO_CONTENT);

    expect(chatMessagesService.delete).toHaveBeenCalledWith(
      'chat-room-1',
      'message-1',
      { id: 'user-1', email: 'user@example.com' },
    );
  });
});
