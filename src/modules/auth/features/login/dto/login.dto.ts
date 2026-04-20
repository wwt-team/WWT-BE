import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { SCHOOL_EMAIL_REGEX } from '../../../../../common/constants/school-email';

export class LoginDto {
  @IsEmail({}, { message: 'INVALID_LOGIN_EMAIL' })
  @Matches(SCHOOL_EMAIL_REGEX, { message: 'INVALID_LOGIN_EMAIL' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'MISSING_LOGIN_PASSWORD' })
  password!: string;
}
