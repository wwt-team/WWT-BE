import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatMessagesService } from './features/messages/chat-messages.service';
import { CreateChatMessageDto } from './features/messages/dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './features/messages/dto/update-chat-message.dto';
import { ChatsService } from './chats.service';

type SocketUser = {
  id: string;
  email: string;
};

type ChatSocket = Socket & {
  data: {
    user?: SocketUser;
  };
};

@WebSocketGateway({
  namespace: '/chats',
  cors: {
    origin: (
      process.env.CHAT_CORS_ORIGIN ??
      'http://localhost:3000,https://wwt.ium.dev,https://www.wwt.ium.dev'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatsService: ChatsService,
    private readonly chatMessagesService: ChatMessagesService,
  ) {}

  async handleConnection(client: ChatSocket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      client.data.user = {
        id: String(payload.sub),
        email: payload.email,
      };
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { chatRoomId: number },
  ) {
    const user = this.requireUser(client);
    const chatRoomId = this.requirePositiveInt(body.chatRoomId, '유효한 chatRoomId가 필요합니다.');
    const room = await this.chatsService.findRoomOrThrow(String(chatRoomId));
    this.chatsService.assertParticipant(
      room,
      user.id,
      '채팅방에 참여할 권한이 없습니다.',
    );

    await client.join(String(chatRoomId));
    return { chatRoomId };
  }

  @SubscribeMessage('leave_room')
  async leaveRoom(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { chatRoomId: number },
  ) {
    const user = this.requireUser(client);
    const chatRoomId = this.requirePositiveInt(body.chatRoomId, '유효한 chatRoomId가 필요합니다.');
    const room = await this.chatsService.findRoomOrThrow(String(chatRoomId));
    this.chatsService.assertParticipant(
      room,
      user.id,
      '채팅방에서 나갈 권한이 없습니다.',
    );

    await client.leave(String(chatRoomId));
    return { chatRoomId };
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { chatRoomId: number; content: string },
  ) {
    const user = this.requireUser(client);
    const chatRoomId = this.requirePositiveInt(body.chatRoomId, '유효한 chatRoomId가 필요합니다.');
    const content = this.requireContent(body.content);
    const result = await this.chatMessagesService.create(
      String(chatRoomId),
      { content } as CreateChatMessageDto,
      user,
    );

    this.server.to(String(chatRoomId)).emit('message_created', result);
    return result;
  }

  @SubscribeMessage('update_message')
  async updateMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { chatRoomId: number; messageId: number; content: string },
  ) {
    const user = this.requireUser(client);
    const chatRoomId = this.requirePositiveInt(body.chatRoomId, '유효한 chatRoomId가 필요합니다.');
    const messageId = this.requirePositiveInt(body.messageId, '유효한 messageId가 필요합니다.');
    const content = this.requireContent(body.content);
    const result = await this.chatMessagesService.update(
      String(chatRoomId),
      String(messageId),
      { content } as UpdateChatMessageDto,
      user,
    );

    this.server.to(String(chatRoomId)).emit('message_updated', result);
    return result;
  }

  @SubscribeMessage('delete_message')
  async deleteMessage(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { chatRoomId: number; messageId: number },
  ) {
    const user = this.requireUser(client);
    const chatRoomId = this.requirePositiveInt(body.chatRoomId, '유효한 chatRoomId가 필요합니다.');
    const messageId = this.requirePositiveInt(body.messageId, '유효한 messageId가 필요합니다.');
    const result = await this.chatMessagesService.delete(
      String(chatRoomId),
      String(messageId),
      user,
    );

    this.server.to(String(chatRoomId)).emit('message_deleted', result);
    return result;
  }

  private extractToken(client: ChatSocket) {
    const authToken = client.handshake.auth.token;
    const headerToken = client.handshake.headers.authorization;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    if (typeof headerToken === 'string' && headerToken.length > 0) {
      return headerToken.replace(/^Bearer\s+/i, '');
    }

    return null;
  }

  private requireUser(client: ChatSocket) {
    if (!client.data.user) {
      throw new WsException('인증이 필요합니다.');
    }

    return client.data.user;
  }

  private requirePositiveInt(value: number, message: string) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new WsException(message);
    }

    return value;
  }

  private requireContent(content: string) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new WsException('메시지 내용이 올바르지 않습니다.');
    }

    return content.trim();
  }
}
