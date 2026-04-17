import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ChatMessage } from '../../entities/chat-message.entity';
import { ChatsService } from '../../chats.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { MessageListQueryDto } from './dto/message-list-query.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';

const DELETED_MESSAGE_CONTENT = '삭제된 메시지입니다.';

@Injectable()
export class ChatMessagesService {
  constructor(private readonly chatsService: ChatsService) {}

  async list(chatRoomId: string, user: RequestUser, query: MessageListQueryDto) {
    const room = await this.chatsService.findRoomOrThrow(chatRoomId);
    this.chatsService.assertParticipant(
      room,
      user.id,
      '채팅방 메시지를 조회할 권한이 없습니다.',
    );

    const [items, total] = await this.chatsService.chatMessagesRepositoryRef.findAndCount({
      where: { chatRoomId: room.id },
      relations: { sender: true },
      order: { createdAt: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      items: items.map((message) => this.toMessageWithSenderResponse(message)),
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  async create(chatRoomId: string, dto: CreateChatMessageDto, user: RequestUser) {
    const room = await this.chatsService.findRoomOrThrow(chatRoomId);
    this.chatsService.assertParticipant(
      room,
      user.id,
      '채팅방에 메시지를 등록할 권한이 없습니다.',
    );

    const message = this.chatsService.chatMessagesRepositoryRef.create({
      chatRoomId: room.id,
      senderId: user.id,
      content: dto.content,
      isDeleted: false,
      editedAt: null,
    } as Partial<ChatMessage>);

    const savedMessage = await this.chatsService.chatMessagesRepositoryRef.save(message);

    return {
      id: Number(savedMessage.id),
      chatRoomId: Number(savedMessage.chatRoomId),
      senderId: Number(savedMessage.senderId),
      content: savedMessage.content,
      isDeleted: savedMessage.isDeleted,
      editedAt: savedMessage.editedAt,
      createdAt: savedMessage.createdAt,
    };
  }

  async update(
    chatRoomId: string,
    messageId: string,
    dto: UpdateChatMessageDto,
    user: RequestUser,
  ) {
    const room = await this.chatsService.findRoomOrThrow(chatRoomId);
    this.chatsService.assertParticipant(
      room,
      user.id,
      '메시지를 수정할 권한이 없습니다.',
    );

    const message = await this.chatsService.findMessageOrThrow(messageId);

    if (String(message.chatRoomId) !== String(room.id)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.CHAT_MESSAGE_NOT_FOUND,
        '메시지를 찾을 수 없습니다.',
      );
    }

    if (String(message.senderId) !== String(user.id)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        '메시지를 수정할 권한이 없습니다.',
      );
    }

    if (message.isDeleted) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CHAT_MESSAGE,
        '삭제된 메시지는 수정할 수 없습니다.',
      );
    }

    message.content = dto.content;
    message.editedAt = new Date();
    const updatedMessage = await this.chatsService.chatMessagesRepositoryRef.save(message);

    return {
      id: Number(updatedMessage.id),
      chatRoomId: Number(updatedMessage.chatRoomId),
      senderId: Number(updatedMessage.senderId),
      content: updatedMessage.content,
      isDeleted: updatedMessage.isDeleted,
      editedAt: updatedMessage.editedAt,
      createdAt: updatedMessage.createdAt,
    };
  }

  async delete(chatRoomId: string, messageId: string, user: RequestUser) {
    const room = await this.chatsService.findRoomOrThrow(chatRoomId);
    this.chatsService.assertParticipant(
      room,
      user.id,
      '메시지를 삭제할 권한이 없습니다.',
    );

    const message = await this.chatsService.findMessageOrThrow(messageId);

    if (String(message.chatRoomId) !== String(room.id)) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.CHAT_MESSAGE_NOT_FOUND,
        '메시지를 찾을 수 없습니다.',
      );
    }

    if (String(message.senderId) !== String(user.id)) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ERROR_CODES.FORBIDDEN,
        '메시지를 삭제할 권한이 없습니다.',
      );
    }

    message.isDeleted = true;
    message.content = DELETED_MESSAGE_CONTENT;
    message.editedAt = null;
    const deletedMessage = await this.chatsService.chatMessagesRepositoryRef.save(message);

    return {
      id: Number(deletedMessage.id),
      chatRoomId: Number(deletedMessage.chatRoomId),
      senderId: Number(deletedMessage.senderId),
      content: deletedMessage.content,
      isDeleted: deletedMessage.isDeleted,
      editedAt: deletedMessage.editedAt,
      createdAt: deletedMessage.createdAt,
    };
  }

  private toMessageWithSenderResponse(message: ChatMessage) {
    return {
      id: Number(message.id),
      chatRoomId: Number(message.chatRoomId),
      sender: {
        id: Number(message.sender.id),
        nickname: message.sender.nickname,
      },
      content: message.content,
      isDeleted: message.isDeleted,
      editedAt: message.editedAt,
      createdAt: message.createdAt,
    };
  }
}
