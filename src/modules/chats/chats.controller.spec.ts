import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AUTH_ERROR_MESSAGE_KEY } from '../../common/decorators/auth-error-message.decorator';
import { ChatsController } from './chats.controller';

describe('ChatsController', () => {
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

  const controller = new ChatsController(
    chatRoomsService as never,
    chatMessagesService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates chat room creation', () => {
    const dto = { productId: 1, receiverId: 2 };
    const user = { id: '1', email: 'seller@example.com' };

    controller.createRoom(dto as never, user);

    expect(chatRoomsService.create).toHaveBeenCalledWith(dto, user);
  });

  it('delegates chat room listing', () => {
    const user = { id: '1', email: 'seller@example.com' };
    const query = { page: 1, limit: 20 };

    controller.listRooms(user, query as never);

    expect(chatRoomsService.list).toHaveBeenCalledWith(user, query);
  });

  it('delegates message listing', () => {
    const user = { id: '1', email: 'seller@example.com' };
    const query = { page: 1, limit: 20 };

    controller.listMessages('1', user, query as never);

    expect(chatMessagesService.list).toHaveBeenCalledWith('1', user, query);
  });

  it('delegates message creation', () => {
    const dto = { content: '안녕하세요' };
    const user = { id: '1', email: 'seller@example.com' };

    controller.createMessage('1', dto as never, user);

    expect(chatMessagesService.create).toHaveBeenCalledWith('1', dto, user);
  });

  it('delegates message update', () => {
    const dto = { content: '수정된 메시지' };
    const user = { id: '1', email: 'seller@example.com' };

    controller.updateMessage('1', '2', dto as never, user);

    expect(chatMessagesService.update).toHaveBeenCalledWith('1', '2', dto, user);
  });

  it('delegates message deletion', async () => {
    const user = { id: '1', email: 'seller@example.com' };

    await controller.deleteMessage('1', '2', user);

    expect(chatMessagesService.delete).toHaveBeenCalledWith('1', '2', user);
  });

  it('uses no-content status on delete', () => {
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, ChatsController.prototype.deleteMessage),
    ).toBe(HttpStatus.NO_CONTENT);
  });

  it('stores route-specific auth messages on protected endpoints', () => {
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.createRoom),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.listRooms),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.listMessages),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.createMessage),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.updateMessage),
    ).toBeDefined();
    expect(
      Reflect.getMetadata(AUTH_ERROR_MESSAGE_KEY, ChatsController.prototype.deleteMessage),
    ).toBeDefined();
  });
});
