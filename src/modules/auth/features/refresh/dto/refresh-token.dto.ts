import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'INVALID_REFRESH_TOKEN' })
  refreshToken!: string;
}
