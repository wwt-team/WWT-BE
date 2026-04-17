import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @IsString()
  @IsNotEmpty({ message: 'INVALID_REFRESH_TOKEN' })
  refreshToken!: string;
}
