import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'INVALID_SIGNUP_EMAIL' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'INVALID_SIGNUP_PASSWORD' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'INVALID_SIGNUP_NICKNAME' })
  nickname!: string;

  @IsString()
  @IsNotEmpty({ message: 'MISSING_EMAIL_VERIFICATION_TOKEN' })
  emailVerificationToken!: string;
}
