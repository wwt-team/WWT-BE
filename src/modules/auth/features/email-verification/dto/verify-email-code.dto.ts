import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'INVALID_EMAIL_CODE' })
  code!: string;
}
