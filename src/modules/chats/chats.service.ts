import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { ApiException } from '../../common/exceptions/api.exception';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomsRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessagesRepository: Repository<ChatMessage>,
  ) {}

  async findRoomOrThrow(
    chatRoomId: string,
    relations?: FindOptionsRelations<ChatRoom>,
  ) {
    const room = await this.chatRoomsRepository.findOne({
      where: { id: String(chatRoomId) },
      relations,
    });

    if (!room) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.CHAT_ROOM_NOT_FOUND,
        '채팅방을 찾을 수 없습니다.',
      );
    }

    return room;
  }

  assertParticipant(room: ChatRoom, userId: string, message: string) {
    if (String(room.buyerId) !== String(userId) && String(room.sellerId) !== String(userId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, message);
    }
  }

  async findMessageOrThrow(messageId: string, relations?: FindOptionsRelations<ChatMessage>) {
    const message = await this.chatMessagesRepository.findOne({
      where: { id: String(messageId) },
      relations,
    });

    if (!message) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        ERROR_CODES.CHAT_MESSAGE_NOT_FOUND,
        '메시지를 찾을 수 없습니다.',
      );
    }

    return message;
  }

  get chatRoomsRepositoryRef() {
    return this.chatRoomsRepository;
  }

  get chatMessagesRepositoryRef() {
    return this.chatMessagesRepository;
  }
}
