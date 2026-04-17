import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'INVALID_LOGIN_EMAIL' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'MISSING_LOGIN_PASSWORD' })
  password!: string;
}
