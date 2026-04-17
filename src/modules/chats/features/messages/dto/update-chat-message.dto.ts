import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'INVALID_CHAT_MESSAGE' })
  content!: string;
}
