import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '../../../../common/constants/error-codes';
import { ApiException } from '../../../../common/exceptions/api.exception';
import type { RequestUser } from '../../../../common/types/request-user.type';
import { ProductsService } from '../../../products/products.service';
import { UsersService } from '../../../users/users.service';
import { ChatRoom } from '../../entities/chat-room.entity';
import { ChatsService } from '../../chats.service';
import { ChatListQueryDto } from './dto/chat-list-query.dto';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';

@Injectable()
export class ChatRoomsService {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateChatRoomDto, user: RequestUser) {
    this.validateCreateRoomInput(dto);

    const product = await this.productsService.findProductOrThrow(String(dto.productId));
    const sellerId = String(product.sellerId);
    const receiverId = String(dto.receiverId);
    const userId = String(user.id);

    if (receiverId === userId) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        ERROR_CODES.SELF_TRADE_NOT_ALLOWED,
        '자기 자신과 채팅방을 만들 수 없습니다.',
      );
    }

    const receiver = await this.usersService
      .findByIdOrThrow(String(dto.receiverId))
      .catch(() => {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.INVALID_CHAT_RECEIVER_ID,
          '채팅 상대의 정보가 올바르지 않습니다.',
        );
      });

    let buyerId: string;

    if (userId === sellerId) {
      buyerId = String(receiver.id);
    } else {
      if (receiverId !== sellerId) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          ERROR_CODES.INVALID_CHAT_RECEIVER_ID,
          '채팅 상대의 정보가 올바르지 않습니다.',
        );
      }

      buyerId = userId;
    }

    const existingRoom = await this.chatsService.chatRoomsRepositoryRef.findOne({
      where: {
        productId: String(product.id),
        buyerId,
        sellerId,
      },
    });

    if (existingRoom) {
      return {
        id: Number(existingRoom.id),
        productId: Number(existingRoom.productId),
        buyerId: Number(existingRoom.buyerId),
        sellerId: Number(existingRoom.sellerId),
        createdAt: existingRoom.createdAt,
      };
    }

    const room = this.chatsService.chatRoomsRepositoryRef.create({
      productId: String(product.id),
      buyerId,
      sellerId,
    } as Partial<ChatRoom>);

    const savedRoom = await this.chatsService.chatRoomsRepositoryRef.save(room);

    return {
      id: Number(savedRoom.id),
      productId: Number(savedRoom.productId),
      buyerId: Number(savedRoom.buyerId),
      sellerId: Number(savedRoom.sellerId),
      createdAt: savedRoom.createdAt,
    };
  }

  async list(user: RequestUser, query: ChatListQueryDto) {
    const [rooms, total] = await this.chatsService.chatRoomsRepositoryRef.findAndCount({
      where: [{ buyerId: user.id }, { sellerId: user.id }],
      relations: { product: true, buyer: true, seller: true },
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    const items = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await this.chatsService.chatMessagesRepositoryRef.findOne({
          where: { chatRoomId: room.id },
          order: { createdAt: 'DESC' },
        });

        return {
          id: Number(room.id),
          product: {
            id: Number(room.product.id),
            title: room.product.title,
            price: room.product.price,
          },
          buyer: {
            id: Number(room.buyer.id),
            nickname: room.buyer.nickname,
          },
          seller: {
            id: Number(room.seller.id),
            nickname: room.seller.nickname,
          },
          lastMessage: lastMessage
            ? {
                id: Number(lastMessage.id),
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
              }
            : null,
          createdAt: room.createdAt,
        };
      }),
    );

    return {
      items,
      page: query.page,
      limit: query.limit,
      total,
    };
  }

  private validateCreateRoomInput(dto: CreateChatRoomDto) {
    if (dto.productId === undefined || dto.productId === null) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_CHAT_PRODUCT_ID,
        '거래할 상품을 선택해주세요.',
      );
    }

    if (dto.receiverId === undefined || dto.receiverId === null) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_CHAT_RECEIVER_ID,
        '채팅 상대를 선택해주세요.',
      );
    }

    if (!Number.isInteger(dto.receiverId) || dto.receiverId <= 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.INVALID_CHAT_RECEIVER_ID,
        '채팅 상대의 정보가 올바르지 않습니다.',
      );
    }

    if (!Number.isInteger(dto.productId) || dto.productId <= 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        ERROR_CODES.MISSING_CHAT_PRODUCT_ID,
        '거래할 상품을 선택해주세요.',
      );
    }
  }
}
