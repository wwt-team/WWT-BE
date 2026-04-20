import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { SCHOOL_EMAIL_REGEX } from '../../../../../common/constants/school-email';

export class SignupDto {
  @IsEmail({}, { message: 'INVALID_SIGNUP_EMAIL' })
  @Matches(SCHOOL_EMAIL_REGEX, { message: 'INVALID_SIGNUP_EMAIL' })
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
