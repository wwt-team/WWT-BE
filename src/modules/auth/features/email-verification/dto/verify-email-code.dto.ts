import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { SCHOOL_EMAIL_REGEX } from '../../../../../common/constants/school-email';

export class VerifyEmailCodeDto {
  @IsEmail({}, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  @Matches(SCHOOL_EMAIL_REGEX, { message: 'INVALID_EMAIL_CODE_REQUEST_EMAIL' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'INVALID_EMAIL_CODE' })
  code!: string;
}
