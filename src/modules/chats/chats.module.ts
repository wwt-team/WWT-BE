import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { ChatsService } from './chats.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessagesService } from './features/messages/chat-messages.service';
import { ChatRoomsService } from './features/rooms/chat-rooms.service';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([ChatRoom, ChatMessage]),
    ProductsModule,
    UsersModule,
  ],
  controllers: [ChatsController],
  providers: [
    ChatsService,
    ChatRoomsService,
    ChatMessagesService,
    ChatsGateway,
  ],
})
export class ChatsModule {}
