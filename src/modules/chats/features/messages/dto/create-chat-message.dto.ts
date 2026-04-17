import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'INVALID_CHAT_MESSAGE' })
  content!: string;
}
