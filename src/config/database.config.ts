import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EmailVerification } from '../modules/auth/entities/email-verification.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { ChatMessage } from '../modules/chats/entities/chat-message.entity';
import { ChatRoom } from '../modules/chats/entities/chat-room.entity';
import { Product } from '../modules/products/entities/product.entity';
import { TradeRequest } from '../modules/trade-requests/entities/trade-request.entity';
import { User } from '../modules/users/entities/user.entity';

export function getDatabaseConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const host = configService.getOrThrow<string>('DB_HOST');
  const useSsl =
    configService.get<string>('DB_SSL') === 'true' || host.includes('supabase.co');

  return {
    type: 'postgres',
    host,
    port: Number(configService.getOrThrow<string>('DB_PORT')),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>('DB_DATABASE'),
    entities: [
      User,
      EmailVerification,
      RefreshToken,
      Product,
      TradeRequest,
      ChatRoom,
      ChatMessage,
    ],
    synchronize: configService.get<string>('TYPEORM_SYNC') === 'true',
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}
