import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { RequestUser } from '../../common/types/request-user.type';
import { ChatMessagesService } from './features/messages/chat-messages.service';
import { CreateChatMessageDto } from './features/messages/dto/create-chat-message.dto';
import { MessageListQueryDto } from './features/messages/dto/message-list-query.dto';
import { UpdateChatMessageDto } from './features/messages/dto/update-chat-message.dto';
import { ChatRoomsService } from './features/rooms/chat-rooms.service';
import { ChatListQueryDto } from './features/rooms/dto/chat-list-query.dto';
import { CreateChatRoomDto } from './features/rooms/dto/create-chat-room.dto';

@Controller('chats')
export class ChatsController {
  constructor(
    private readonly chatRoomsService: ChatRoomsService,
    private readonly chatMessagesService: ChatMessagesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createRoom(@Body() dto: CreateChatRoomDto, @CurrentUser() user: RequestUser) {
    return this.chatRoomsService.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listRooms(@CurrentUser() user: RequestUser, @Query() query: ChatListQueryDto) {
    return this.chatRoomsService.list(user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':chatRoomId/messages')
  listMessages(
    @Param('chatRoomId') chatRoomId: string,
    @CurrentUser() user: RequestUser,
    @Query() query: MessageListQueryDto,
  ) {
    return this.chatMessagesService.list(chatRoomId, user, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':chatRoomId/messages')
  createMessage(
    @Param('chatRoomId') chatRoomId: string,
    @Body() dto: CreateChatMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatMessagesService.create(chatRoomId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':chatRoomId/messages/:messageId')
  updateMessage(
    @Param('chatRoomId') chatRoomId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateChatMessageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.chatMessagesService.update(chatRoomId, messageId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':chatRoomId/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('chatRoomId') chatRoomId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.chatMessagesService.delete(chatRoomId, messageId, user);
  }
}
